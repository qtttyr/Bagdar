import { useEffect, useState, useCallback } from "react";
import type { GenerateResponse } from "@/types/api";

const STORAGE_KEY = "bagdar_plans";

interface Step {
  id: string;
  title: string;
  duration: number;
  description?: string | null;
  type: "learning" | "practice" | "break";
  order: number;
}

interface Break {
  id: string;
  duration: number;
  message: string;
}

export interface SavedPlan {
  id: string;
  title: string;
  total_duration: number;
  steps: Step[];
  breaks: Break[];
  persona: string;
  created_at: string;
  createdAt: string;
  quote: {
    kz: string;
    ru: string;
  };
}

export function usePlans() {
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPlans(JSON.parse(stored));
      }
    } catch {
      setPlans([]);
    }
    setLoaded(true);
  }, []);

  const savePlan = useCallback((response: GenerateResponse) => {
    const saved: SavedPlan = {
      id: response.plan.id,
      title: response.plan.title,
      total_duration: response.plan.total_duration,
      steps: response.plan.steps,
      breaks: response.plan.breaks,
      persona: response.plan.persona,
      created_at: response.plan.created_at,
      createdAt: new Date().toISOString(),
      quote: response.quote,
    };

    setPlans((prev) => {
      const updated = [saved, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deletePlan = useCallback((id: string) => {
    setPlans((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setPlans([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { plans, loaded, savePlan, deletePlan, clearAll };
}