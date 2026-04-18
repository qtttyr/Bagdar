/**
 * Type definitions for Baǵdar frontend <-> backend API.
 *
 * These types mirror the Pydantic models defined on the backend and are
 * intended to be used throughout the frontend for strict TypeScript typing.
 */

/** Persona options (matches backend PersonaType enum) */
export type PersonaType = "aksakal" | "abay" | "nomad";

/**
 * Request payload for roadmap generation
 * - `topics` — array of topic strings (required)
 * - `duration_minutes` — total session duration in minutes (required)
 * - `persona` — optional persona preference
 * - `level` — optional user level (e.g. "beginner", "intermediate", "advanced")
 */
export interface RoadmapRequest {
  topics: string[];
  duration_minutes: number;
  persona?: PersonaType;
  level?: string;
}

/** Allowed step types */
export type StepType = "learning" | "practice" | "break";

/** Single step (station) of the roadmap */
export interface Step {
  id: string;
  title: string;
  duration: number; // minutes
  description?: string | null;
  type: StepType;
  order: number;
}

/** Break entry (adaptive break suggestion) */
export interface BreakItem {
  id: string;
  duration: number; // minutes
  message: string;
}

/** Roadmap (plan) returned by the backend */
export interface RoadmapResponse {
  id: string;
  title: string;
  total_duration: number; // minutes
  steps: Step[];
  breaks: BreakItem[];
  persona: string;
  created_at: string; // ISO 8601 timestamp
}

/** Quote pair (Kazakh + Russian) */
export interface QuoteResponse {
  kz: string;
  ru: string;
}

/** Full response shape from /generate */
export interface GenerateResponse {
  plan: RoadmapResponse;
  quote: QuoteResponse;
}
