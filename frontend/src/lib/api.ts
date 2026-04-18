/* Lightweight API client wrapper for Baǵdar frontend
 *
 * Responsibilities:
 * - Provide a typed function `generateRoadmap` that posts to the backend generate endpoint.
 * - Expose a small `ApiError` class for consistent error handling.
 * - Support an overridable base URL (via Vite env var `VITE_API_BASE_URL`) and a sensible default.
 * - Support request timeouts with AbortController.
 *
 * Notes:
 * - Types `RoadmapRequest` and `GenerateResponse` are imported from `@/types/api`.
 *   Make sure `src/types/api.ts` matches the backend Pydantic models.
 */

import type { RoadmapRequest, GenerateResponse } from "@/types/api";

const DEFAULT_TIMEOUT_MS = 60000;

// Prefer an environment-configured base URL; fall back to localhost backend.
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://localhost:8000";

/**
 * ApiError - thrown on non-2xx responses or network failures.
 */
export class ApiError extends Error {
  status: number | null;
  details?: unknown;

  constructor(message: string, status: number | null = null, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * buildUrl - helper to join base and path robustly
 */
function buildUrl(base: string, path: string) {
  // Ensure single slash between base and path
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

/**
 * safeJsonParse - try to parse JSON, otherwise return raw text
 */
async function safeJsonParse(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

/**
 * tryEndpoints - attempt the POST to several candidate endpoints in sequence.
 *
 * Rationale: backend's router setup may lead to either
 *  - /api/v1/generate
 *  - /api/v1/generate/generate
 *
 * We try a small list to be resilient during development; the first 2xx is returned.
 */
async function tryEndpoints(
  pathCandidates: string[],
  body: unknown,
  timeoutMs: number,
  signal?: AbortSignal
) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  for (const p of pathCandidates) {
    const url = buildUrl(API_BASE, p);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    // If caller passed signal, listen and forward
    const combinedSignal = signal
      ? mergeAbortSignals(signal, controller.signal)
      : controller.signal;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: combinedSignal,
      });

      clearTimeout(timer);

      if (res.ok) {
        const parsed = await safeJsonParse(res);
        return { ok: true, status: res.status, data: parsed };
      }

      // For 4xx/5xx: parse body for helpful message and throw after trying fallbacks.
      const parsedError = await safeJsonParse(res);

      // If 404, we continue to next candidate; otherwise return error info.
      if (res.status === 404) {
        // try next candidate
        continue;
      }

      return { ok: false, status: res.status, error: parsedError };
    } catch (err) {
      clearTimeout(timer);

      // If aborted by timeout/parent signal, propagate
      if (err instanceof DOMException && err.name === "AbortError") {
        return {
          ok: false,
          status: null,
          error: new ApiError("Request aborted (timeout or cancelled).", null),
        };
      }

      // Network-level error; return and let caller decide to retry
      return { ok: false, status: null, error: err };
    }
  }

  // If we reach here, all candidates returned 404 / network aborted
  return {
    ok: false,
    status: 404,
    error: new ApiError(
      `No valid generate endpoint found on server. Tried: ${pathCandidates.join(
        ", "
      )}`,
      404
    ),
  };
}

/**
 * mergeAbortSignals - minimal utility to combine two AbortSignals into one.
 * If either aborts, the returned signal will abort.
 */
function mergeAbortSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (!a && !b) {
    return new AbortController().signal;
  }
  if (!a) return b;
  if (!b) return a;

  const controller = new AbortController();

  const onAbort = () => {
    controller.abort();
    cleanup();
  };
  const cleanup = () => {
    a.removeEventListener("abort", onAbort);
    b.removeEventListener("abort", onAbort);
  };

  if (a.aborted || b.aborted) {
    controller.abort();
    cleanup();
    return controller.signal;
  }

  a.addEventListener("abort", onAbort);
  b.addEventListener("abort", onAbort);

  return controller.signal;
}

/**
 * generateRoadmap - main exported function
 *
 * Parameters:
 * - request: RoadmapRequest (topics, duration_minutes, persona, level)
 * - options?: { timeoutMs?: number, signal?: AbortSignal, path?: string }
 *
 * Behavior:
 * - POSTs JSON to backend.
 * - Attempts a couple of path variations to be resilient during development.
 * - Throws ApiError on non-recoverable failures.
 */
export async function generateRoadmap(
  request: RoadmapRequest,
  options?: {
    timeoutMs?: number;
    signal?: AbortSignal;
    // Optional explicit path (relative to API_BASE) to POST to, e.g. "api/v1/generate"
    // If provided it will be tried first, then the fallback list is attempted.
    path?: string;
  }
): Promise<GenerateResponse> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // Candidate relative paths to attempt, in order.
  const fallbackCandidates = [
    // Common desired endpoint patterns:
    // If user sets explicit path, try that first
    ...(options?.path ? [options.path] : []),
    // typical "single generate" endpoint
    "api/v1/generate",
    // if backend used an inner router with "/generate" and outer prefix "/generate"
    "api/v1/generate/generate",
    // older variants that might exist in some dev setups
    "generate",
    "api/generate",
  ];

  const result = await tryEndpoints(fallbackCandidates, request, timeoutMs, options?.signal);

  if (result.ok) {
    // We assume the server returned a shape compatible with GenerateResponse.
    return result.data as GenerateResponse;
  }

  // Normalize and throw ApiError
  const status = (result as any).status ?? null;
  const err = (result as any).error;

  if (err instanceof ApiError) {
    throw err;
  }

  // If server returned structured error info, try to include it.
  let message = "Failed to generate roadmap.";
  if (err && typeof err === "object") {
    try {
      // Attempt to extract a helpful message from common shapes
      if ((err as any).detail) message = String((err as any).detail);
      else if ((err as any).message) message = String((err as any).message);
      else message = JSON.stringify(err);
    } catch {
      // fallback to default
    }
  } else if (typeof err === "string") {
    message = err;
  }

  throw new ApiError(message, status, err);
}

/**
 * Utility: setApiBase - override the base URL at runtime (useful for tests)
 */
export function setApiBase(url: string) {
  (globalThis as any).__BAGDAR_API_BASE__ = url.replace(/\/+$/, "");
}

/**
 * Utility: getApiBase - runtime base resolution; respects runtime override.
 */
export function getApiBase() {
  return (globalThis as any).__BAGDAR_API_BASE__ ?? API_BASE;
}
