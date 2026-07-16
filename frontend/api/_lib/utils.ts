/**
 * Security & HTTP utilities for Baǵdar API.
 *
 * Zero external dependencies — pure Node.js + Web Crypto.
 *
 * ===== PROTECTION LAYERS =====
 * 1. Input validation (hard limits)
 * 2. Origin check (CORS whitelist)
 * 3. User-Agent check (blocks curl/wget/Python)
 * 4. HMAC-SHA256 request signature verification (blocks forged requests)
 * 5. Signed cookie daily limit (5 generations / day / IP)
 * 6. CORS + response helpers
 */

import type { PersonaType } from "./types.js";
import { createHmac, timingSafeEqual } from "node:crypto";

// ═══════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://bagdar.vercel.app",
];

const MAX_TOPICS = 5;
const MAX_TOPIC_LENGTH = 200;
const MIN_DURATION = 15;
const MAX_DURATION = 480;
const ALLOWED_LEVELS = ["beginner", "intermediate", "advanced"] as const;

const MAX_BODY_BYTES = 10_000; // 10 KB max request body

/** Shared secret for HMAC signing + cookie encryption.
 *  Set API_SECRET env var in production; falls back to this constant. */
const SIGNING_SECRET = process.env.API_SECRET || "bagdar-hmac-secret-2026";

const DAILY_GENERATION_LIMIT = 5;

// ═══════════════════════════════════════
//  1. INPUT VALIDATION
// ═══════════════════════════════════════

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRequest(body: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  // ── Body size ──
  const rawSize = approximateJsonSize(body);
  if (rawSize > MAX_BODY_BYTES) {
    errors.push(`Request body too large (max ${MAX_BODY_BYTES} bytes)`);
    return { valid: false, errors }; // early return — no point checking other fields
  }

  // ── topics ──
  const topics = body.topics;
  if (!Array.isArray(topics)) {
    errors.push("topics must be an array");
  } else {
    if (topics.length === 0) {
      errors.push("At least one topic is required");
    } else if (topics.length > MAX_TOPICS) {
      errors.push(`Maximum ${MAX_TOPICS} topics allowed`);
    }

    for (let i = 0; i < topics.length; i++) {
      const t = topics[i];
      if (typeof t !== "string") {
        errors.push(`Topic at index ${i} must be a string`);
      } else {
        const trimmed = t.trim();
        if (trimmed.length === 0) {
          errors.push(`Topic at index ${i} cannot be empty`);
        } else if (trimmed.length > MAX_TOPIC_LENGTH) {
          errors.push(`Topic at index ${i} exceeds ${MAX_TOPIC_LENGTH} characters`);
        }
      }
    }
  }

  // ── duration_minutes ──
  const dur = body.duration_minutes;
  if (typeof dur !== "number" || !Number.isFinite(dur)) {
    errors.push("duration_minutes must be a finite number");
  } else if (dur < MIN_DURATION || dur > MAX_DURATION) {
    errors.push(`Duration must be between ${MIN_DURATION} and ${MAX_DURATION} minutes`);
  }

  // ── level (optional, strict enum) ──
  const level = body.level;
  if (level !== undefined && level !== null && level !== "") {
    if (!ALLOWED_LEVELS.includes(level as any)) {
      errors.push(`Level must be one of: ${ALLOWED_LEVELS.join(", ")}`);
    }
  }

  // ── persona (optional, strict enum) ──
  const persona = body.persona;
  if (persona !== undefined && persona !== null && persona !== "") {
    if (!["aksakal", "abay", "nomad"].includes(persona as string)) {
      errors.push("Persona must be one of: aksakal, abay, nomad");
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Quick approximate JSON byte size without full stringify */
function approximateJsonSize(obj: unknown): number {
  const str = JSON.stringify(obj);
  // ASCII chars are 1 byte in UTF-8; non-ASCII up to 4
  // This is a close enough approximation for a size limit
  return new TextEncoder().encode(str).length;
}

// ═══════════════════════════════════════
//  2. ORIGIN CHECK (CORS whitelist)
// ═══════════════════════════════════════

export function checkOrigin(request: Request): { allowed: boolean; origin: string | null } {
  const origin = request.headers.get("origin");

  // No origin header = same-origin request (fetch from same domain) — safe
  if (!origin) return { allowed: true, origin: null };

  const allowed = ALLOWED_ORIGINS.includes(origin);
  return { allowed, origin };
}

// ═══════════════════════════════════════
//  3. USER-AGENT CHECK
// ═══════════════════════════════════════

/** Known script / CLI user-agents to block */
const BLOCKED_UA_PATTERNS = ["curl", "wget", "python", "python-requests", "go-http", "httpie", "postman", "libcurl"];

export function checkUserAgent(request: Request): { allowed: boolean; reason?: string } {
  const ua = (request.headers.get("user-agent") || "").toLowerCase();

  // Empty or unreasonably short UA (bots often strip it)
  if (ua.length < 10) {
    return { allowed: false, reason: "Suspicious or missing User-Agent" };
  }

  for (const pattern of BLOCKED_UA_PATTERNS) {
    if (ua.includes(pattern)) {
      return { allowed: false, reason: `Script/CLI tool detected: ${pattern}` };
    }
  }

  return { allowed: true };
}

// ═══════════════════════════════════════
//  4. HMAC REQUEST SIGNATURE VERIFICATION
// ═══════════════════════════════════════

/**
 * Verifies that the request was signed by our frontend.
 *
 * The frontend computes:
 *   HMAC-SHA256(SECRET, "POST /api/generate:" + JSON.stringify(body) + ":" + timestamp)
 *
 * We recompute and compare — timing-safe via HMAC comparison.
 */
export function verifyRequestSignature(body: Record<string, unknown>): { valid: boolean; reason?: string } {
  const signature = body._sig as string | undefined;
  const timestamp = body._ts as number | undefined;

  if (!signature || typeof signature !== "string") {
    return { valid: false, reason: "Missing signature (_sig)" };
  }
  if (!timestamp || typeof timestamp !== "number") {
    return { valid: false, reason: "Missing timestamp (_ts)" };
  }

  // ── Timestamp window: ±120 seconds (2 min) — allows clock skew ──
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 120) {
    return { valid: false, reason: "Signature timestamp expired or invalid" };
  }

  // ── Reconstruct clean payload (strip sig fields) ──
  const { _sig: _, _ts: _ts_, ...cleanBody } = body;

  // Build the same string the frontend signed
  const payload = JSON.stringify(cleanBody) + ":" + timestamp;

  // Compute expected signature
  const expected = createHmac("sha256", SIGNING_SECRET).update(payload).digest("hex");

  // Constant-time comparison to prevent timing attacks
  try {
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, reason: "Invalid signature" };
    }
  } catch {
    // Fallback (shouldn't happen, but just in case)
    if (signature !== expected) {
      return { valid: false, reason: "Invalid signature" };
    }
  }

  return { valid: true };
}

// ═══════════════════════════════════════
//  5. DAILY GENERATION LIMIT (signed cookie)
// ═══════════════════════════════════════

interface LimitCookiePayload {
  c: number; // count
  d: string; // date (YYYY-MM-DD)
  i: string; // ip hash (truncated SHA-256 of IP)
  h: string; // hmac signature
}

/**
 * Read and verify the `bagdar_limit` cookie.
 * Returns the current count for today.
 */
function parseLimitCookie(cookieStr: string | null, ipHash: string): number {
  if (!cookieStr) return 0;

  const match = cookieStr.match(/bagdar_limit=([^;]+)/);
  if (!match) return 0;

  try {
    const rawValue = match[1];
    if (!rawValue) return 0;
    const raw: LimitCookiePayload = JSON.parse(decodeURIComponent(rawValue));

    // Reconstruct what the signature should cover
    const dataToSign = `${raw.c}|${raw.d}|${raw.i}`;
    const expected = createHmac("sha256", SIGNING_SECRET).update(dataToSign).digest("hex");

    if (raw.h !== expected) return 0; // tampered cookie

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Different day → reset
    if (raw.d !== today) return 0;

    // Different IP → different user (or VPN change)
    if (raw.i !== ipHash) return 0;

    return raw.c;
  } catch {
    return 0; // malformed cookie, start fresh
  }
}

/**
 * Build a new signed limit cookie.
 */
function buildLimitCookie(count: number, ipHash: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const dataToSign = `${count}|${today}|${ipHash}`;
  const hmac = createHmac("sha256", SIGNING_SECRET).update(dataToSign).digest("hex");

  const value: LimitCookiePayload = { c: count, d: today, i: ipHash, h: hmac };
  const encoded = encodeURIComponent(JSON.stringify(value));

  // HttpOnly + Secure + SameSite=Lax — cannot be read or modified by JS
  // Max-Age = 86400 (24 hours) — cookie auto-expires
  return `bagdar_limit=${encoded}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`;
}

/**
 * Hash an IP address for cookie binding.
 * We use the first 16 hex chars of SHA-256 — enough to bind without storing raw IP.
 */
function hashIP(ip: string): string {
  return createHmac("sha256", SIGNING_SECRET).update("ip:" + ip).digest("hex").slice(0, 16);
}

export interface DailyLimitResult {
  allowed: boolean;
  remaining: number;
  response?: Response;
  newCookie?: string;
}

/**
 * Check the daily generation limit.
 *
 * Flow:
 * 1. Parse and verify the signed `bagdar_limit` cookie
 * 2. If count >= 5 → return 429
 * 3. Otherwise → return { allowed: true, remaining }
 *
 * Caller should call buildIncrementCookie() AFTER successful generation.
 */
export function checkDailyLimit(request: Request): DailyLimitResult {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = hashIP(ip);
  const cookieStr = request.headers.get("cookie");
  const origin = request.headers.get("origin");

  const currentCount = parseLimitCookie(cookieStr, ipHash);

  if (currentCount >= DAILY_GENERATION_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      response: errorResponse(
        `Daily generation limit of ${DAILY_GENERATION_LIMIT} reached. Try again tomorrow.`,
        429,
        origin,
      ),
    };
  }

  return {
    allowed: true,
    remaining: DAILY_GENERATION_LIMIT - currentCount,
  };
}

/**
 * Build the increment cookie AFTER a successful generation.
 * Call this only when the Groq call succeeded and we're about to return 200.
 */
export function buildIncrementCookie(request: Request): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = hashIP(ip);
  const cookieStr = request.headers.get("cookie");

  const currentCount = parseLimitCookie(cookieStr, ipHash);
  return buildLimitCookie(currentCount + 1, ipHash);
}

// ═══════════════════════════════════════
//  6. CORS HEADERS & RESPONSE HELPERS
// ═══════════════════════════════════════

/** Validate and normalize a PersonaType value */
export function parsePersona(raw: string | null): PersonaType {
  if (raw === "aksakal" || raw === "abay" || raw === "nomad") return raw;
  return "abay"; // default
}

/** Validate duration is within acceptable range */
export function validateDuration(minutes: number): number {
  return Math.max(MIN_DURATION, Math.min(MAX_DURATION, Math.round(minutes)));
}

/** Build CORS headers for a given Origin */
function corsHeaders(origin: string | null): Headers {
  const allowOrigin =
    origin && ALLOWED_ORIGINS.includes(origin)
      ? origin
      : "https://bagdar.vercel.app";

  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

/** Standard JSON success response */
export function jsonResponse(
  data: unknown,
  status = 200,
  origin: string | null = null,
  extraHeaders?: Record<string, string>,
): Response {
  const headers = corsHeaders(origin);
  headers.set("Content-Type", "application/json");

  if (extraHeaders) {
    for (const [key, value] of Object.entries(extraHeaders)) {
      headers.set(key, value);
    }
  }

  return new Response(JSON.stringify(data), { status, headers });
}

/** Standard error response */
export function errorResponse(
  message: string,
  status = 400,
  origin: string | null = null,
): Response {
  const headers = corsHeaders(origin);
  headers.set("Content-Type", "application/json");
  return new Response(
    JSON.stringify({ error: true, message }),
    { status, headers },
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
