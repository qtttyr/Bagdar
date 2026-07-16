/**
 * POST /api/generate
 *
 * Main endpoint — generates a learning roadmap using Groq AI.
 * Zero external dependencies — uses native fetch() and crypto.randomUUID().
 *
 * Flow:
 * 1. Validate incoming request body
 * 2. Select persona (system prompt + quote)
 * 3. Call Groq with structured JSON schema output
 * 4. Wrap response with cultural quote
 * 5. Return fully typed GenerateResponse
 */

import type { PersonaType, RoadmapRequest, GenerateResponse, RoadmapResponse, RoadmapStep, RoadmapBreak } from "./_lib/types.js";
import { SYSTEM_PROMPTS, buildUserMessage } from "./_lib/prompts.js";
import { getQuote } from "./_lib/quotes.js";
import { ROADMAP_SCHEMA } from "./_lib/schemas.js";
import { generateStructured } from "./_lib/groq.js";
import { parsePersona, validateDuration, jsonResponse, errorResponse, handleOptions } from "./_lib/utils.js";

/**
 * Raw shape returned by Groq before we map it to our response types.
 */
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

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");

  // ---- OPTIONS preflight ----
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  // ---- Parse body ----
  let body: RoadmapRequest;
  try {
    body = (await request.json()) as RoadmapRequest;
  } catch {
    return errorResponse("Invalid JSON body", 400, origin);
  }

  const topics = body.topics?.filter(Boolean) ?? [];
  if (topics.length === 0) {
    return errorResponse("At least one topic is required", 400, origin);
  }

  const durationMinutes = validateDuration(body.duration_minutes ?? 60);
  const persona: PersonaType = parsePersona(body.persona ?? null);
  const level = body.level ?? "beginner";

  // ---- Build prompts ----
  const systemPrompt = SYSTEM_PROMPTS[persona];
  const userMessage = buildUserMessage({ topics, duration_minutes: durationMinutes, level });

  // ---- Call Groq with structured output ----
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

  // ---- Map to response types ----
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

  return jsonResponse(response, 200, origin);
}
