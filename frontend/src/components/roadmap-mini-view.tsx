import { useMemo } from "react";
import type { SavedPlan } from "@/hooks/use-plans";

interface RoadmapMiniViewProps {
  plan: SavedPlan;
}

export function RoadmapMiniView({ plan }: RoadmapMiniViewProps) {
  const steps = useMemo(() => {
    return [...(plan.steps || [])].sort((a, b) => a.order - b.order);
  }, [plan.steps]);

  const typeConfig = {
    learning: {
      gradient: "from-violet-500 to-purple-600",
      bg: "bg-violet-500",
      label: "Обучение",
    },
    practice: {
      gradient: "from-cyan-500 to-blue-600",
      bg: "bg-cyan-500",
      label: "Практика",
    },
    break: {
      gradient: "from-amber-400 to-orange-500",
      bg: "bg-amber-400",
      label: "Перерыв",
    },
  };

  if (!plan) return null;

  return (
    <div className="rounded-2xl bg-card p-6 shadow-lg ring-1 ring-foreground/8">
      <div className="space-y-3">
        {steps.map((step, index) => {
          const type = (step.type || "learning") as keyof typeof typeConfig;
          const config = typeConfig[type] || typeConfig.break;

          return (
            <div key={step.id} className="flex items-center gap-4">
              {/* Step indicator */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  text-white font-bold text-sm shadow-lg flex-shrink-0
                  bg-gradient-to-br ${config.gradient}
                `}
              >
                {index + 1}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-background/60">
                    {config.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {step.duration} мин
                  </span>
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                {step.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border/40 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
        {Object.entries(typeConfig).map(([type, cfg]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${cfg.bg}`} />
            <span>{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}