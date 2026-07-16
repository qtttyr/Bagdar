/**
 * Shared type definitions for Baǵdar API (Groq backend).
 * Mirrors frontend/src/types/api.ts for consistency.
 */

export type PersonaType = "aksakal" | "abay" | "nomad";

export type ChecklistType = "theory" | "math" | "practice" | "visual";

export interface ChecklistItem {
  text: string;
  type: ChecklistType;
}

export type StepType = "learning" | "practice" | "break";

export interface RoadmapStep {
  id: string;
  title: string;
  duration: number;
  description?: string | null;
  type: StepType;
  order: number;
  checklist?: ChecklistItem[];
}

export interface RoadmapBreak {
  id: string;
  duration: number;
  message: string;
}

export interface RoadmapRequest {
  topics: string[];
  duration_minutes: number;
  persona?: PersonaType;
  level?: string;
}

export interface RoadmapResponse {
  id: string;
  title: string;
  total_duration: number;
  steps: RoadmapStep[];
  breaks: RoadmapBreak[];
  persona: string;
  created_at: string;
}

export interface QuoteResponse {
  kz: string;
  ru: string;
}

export interface GenerateResponse {
  plan: RoadmapResponse;
  quote: QuoteResponse;
}
