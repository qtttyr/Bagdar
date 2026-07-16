/**
 * POST /api/generate
 *
 * Generates a learning roadmap using Groq AI.
 *
 * ===== SECURITY CHAIN =====
 * 1. OPTIONS preflight → 204
 * 2. Origin check → 403 if unknown origin
 * 3. User-Agent check → 403 if curl/wget/Python
 * 4. Parse body → 400 if invalid JSON
 * 5. Input validation → 400 if invalid fields
 * 6. HMAC signature → 401 if forged or expired
 * 7. Daily limit (signed cookie) → 429 if exceeded
 * 8. Call Groq with timeout
 * 9. On success → increment limit cookie
 * 10. Return roadmap + quote
 */

import type { PersonaType, RoadmapRequest, GenerateResponse, RoadmapResponse, RoadmapStep, RoadmapBreak } from "./_lib/types.js";
import { SYSTEM_PROMPTS, buildUserMessage } from "./_lib/prompts.js";
import { getQuote } from "./_lib/quotes.js";
import { ROADMAP_SCHEMA } from "./_lib/schemas.js";
import { generateStructured } from "./_lib/groq.js";
import {
  validateRequest,
  checkOrigin,
  checkUserAgent,
  verifyRequestSignature,
  checkDailyLimit,
  buildIncrementCookie,
  parsePersona,
  validateDuration,
  jsonResponse,
  errorResponse,
  handleOptions,
} from "./_lib/utils.js";

// ═══════════════════════════════════════
//  RAW TYPES (Groq output before mapping)
// ═══════════════════════════════════════

interface RawStep {
  id: string;
  title: string;
  duration: number;
  description?: string;
  type: string;
  order: number;
  checklist?: Array<{ text: string; type: string }>;
}

interface RawBreak {
  id: string;
  duration: number;
  message: string;
}

interface RawRoadmap {
  title: string;
  total_duration: number;
  steps: RawStep[];
  breaks: RawBreak[];
}

// ═══════════════════════════════════════
//  POST HANDLER
// ═══════════════════════════════════════

export async function POST(request: Request): Promise<Response> {
  // ── 1. OPTIONS preflight ──
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  // ── 2. Origin check ──
  const { allowed: originAllowed, origin } = checkOrigin(request);
  if (!originAllowed) {
    return errorResponse("Access denied: unknown origin", 403, origin);
  }

  // ── 3. User-Agent check ──
  const uaCheck = checkUserAgent(request);
  if (!uaCheck.allowed) {
    console.warn("Blocked suspicious UA:", request.headers.get("user-agent"));
    return errorResponse("Access denied: suspicious client", 403, origin);
  }

  // ── 4. Parse body ──
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return errorResponse("Invalid JSON body", 400, origin);
  }

  // ── 5. Input validation ──
  const validation = validateRequest(body);
  if (!validation.valid) {
    return errorResponse(validation.errors.join("; "), 400, origin);
  }

  // ── 6. HMAC signature verification ──
  const sigCheck = verifyRequestSignature(body);
  if (!sigCheck.valid) {
    console.warn("Blocked unsigned request:", sigCheck.reason);
    return errorResponse("Forbidden: " + (sigCheck.reason || "invalid signature"), 401, origin);
  }

  // ── 7. Daily limit check (signed cookie) ──
  const limitCheck = checkDailyLimit(request);
  if (!limitCheck.allowed) {
    return limitCheck.response!;
  }

  // ── Extract validated fields ──
  const topics = (body.topics as string[]).map(t => t.trim());
  const durationMinutes = validateDuration(body.duration_minutes as number);
  const persona: PersonaType = parsePersona((body.persona as string) ?? null);
  const level = (body.level as string) || "beginner";

  // ── Build prompts ──
  const systemPrompt = SYSTEM_PROMPTS[persona];
  const userMessage = buildUserMessage({ topics, duration_minutes: durationMinutes, level });

  // ── 8. Call Groq (with implicit timeout via generateStructured) ──
  let raw: RawRoadmap;
  try {
    raw = await generateStructured<RawRoadmap>({
      systemPrompt,
      userMessage,
      jsonSchema: ROADMAP_SCHEMA.schema,
      temperature: 0.7,
      maxTokens: 4096,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Groq API error";
    console.error("Groq generation failed:", message);
    return errorResponse("AI generation failed. Please try again.", 502, origin);
  }

  // ── 9. Generation succeeded → increment limit cookie ──
  const incrementCookie = buildIncrementCookie(request);

  // ── 10. Map to response types ──
  const now = new Date().toISOString();
  const planId = crypto.randomUUID();

  const steps: RoadmapStep[] = (raw.steps ?? []).map((s: RawStep) => ({
    id: s.id,
    title: s.title,
    duration: s.duration,
    description: s.description ?? "",
    type: s.type as RoadmapStep["type"],
    order: s.order,
    checklist: (s.checklist ?? []).map((c: { text: string; type: string }) => ({
      text: c.text,
      type: c.type as "theory" | "math" | "practice" | "visual",
    })),
  }));

  const breaks: RoadmapBreak[] = (raw.breaks ?? []).map((b: RawBreak) => ({
    id: b.id,
    duration: b.duration,
    message: b.message,
  }));

  const plan: RoadmapResponse = {
    id: planId,
    title: raw.title ?? `Learning Route: ${topics.join(", ")}`,
    total_duration: raw.total_duration ?? durationMinutes,
    steps,
    breaks,
    persona,
    created_at: now,
  };

  const quote = getQuote(persona);
  const response: GenerateResponse = { plan, quote };

  return jsonResponse(response, 200, origin, {
    "Set-Cookie": incrementCookie,
  });
}
