/**
 * HTTP utilities for Vercel Functions.
 * CORS, response helpers, and error handling.
 */

import type { PersonaType } from "./types.js";

/** Allowed origins for CORS */
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "https://bagdar.vercel.app",
];

/** Validate and normalize a PersonaType value */
export function parsePersona(raw: string | null): PersonaType {
  if (raw === "aksakal" || raw === "abay" || raw === "nomad") return raw;
  return "abay"; // default
}

/** Validate duration is within acceptable range */
export function validateDuration(minutes: number): number {
  const clamped = Math.max(15, Math.min(480, Math.round(minutes)));
  return clamped;
}

/**
 * Build CORS headers for a given Origin.
 * Returns permissive but safe: only allows known origins.
 */
export function corsHeaders(origin: string | null): Headers {
  const allowOrigin =
    origin && ALLOWED_ORIGINS.includes(origin)
      ? origin
      : "https://bagdar.vercel.app";

  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

/** Standard JSON success response */
export function jsonResponse(data: unknown, status = 200, origin: string | null = null): Response {
  const headers = corsHeaders(origin);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { status, headers });
}

/** Standard error response */
export function errorResponse(message: string, status = 400, origin: string | null = null): Response {
  const headers = corsHeaders(origin);
  headers.set("Content-Type", "application/json");
  return new Response(
    JSON.stringify({ error: true, message }),
    { status, headers }
  );
}

/** Handle OPTIONS preflight requests */
export function handleOptions(request: Request): Response | null {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request.headers.get("origin")),
    });
  }
  return null;
}
