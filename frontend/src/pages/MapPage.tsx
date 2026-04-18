import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  CheckmarkCircleIcon,
} from "@hugeicons/core-free-icons";
import type { GenerateResponse } from "@/types/api";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type StepType = "learning" | "practice" | "break";

export default function MapPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan as GenerateResponse["plan"] | null;
  const quote = location.state?.quote as GenerateResponse["quote"] | null;

  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<{title: string; description: string; type: StepType; duration: number} | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const handleBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const toggleComplete = useCallback((stepId: string) => {
    setCompleted((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  }, []);

  const resetAll = useCallback(() => {
    setCompleted({});
  }, []);

  const markAll = useCallback(() => {
    if (!plan) return;
    const all: Record<string, boolean> = {};
    plan.steps.forEach((s) => { all[s.id] = true; });
    setCompleted(all);
  }, [plan]);

  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.5} className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Маршрут не найден</h2>
          <p className="text-muted-foreground">Создайте маршрут в генераторе</p>
          <Button onClick={handleBack} className="mt-4">
            К генератору
          </Button>
        </div>
      </div>
    );
  }

  const steps = useMemo(() => {
    return [...plan.steps].sort((a, b) => a.order - b.order);
  }, [plan.steps]);

  const totalMinutes = plan.total_duration;
  const completedCount = Object.values(completed).filter(Boolean).length;

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

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        .timeline-line {
          position: absolute;
          left: 1.5rem;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, 
            rgba(139, 92, 246, 0.3) 0%, 
            rgba(139, 92, 246, 0.1) 50%,
            rgba(139, 92, 246, 0.05) 100%
          );
        }
        
        .station-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .station-card:active {
          transform: scale(0.98);
        }
        
        .station-card.completed {
          opacity: 0.7;
        }
        
        .station-card.active {
          animation: pulse-ring 0.6s ease-out;
        }
        
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
          100% { box-shadow: 0 0 0 12px rgba(139, 92, 246, 0); }
        }

        @media (max-width: 640px) {
          .map-container {
            padding-bottom: 6rem;
          }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.5} className="w-4 h-4" />
            <span className="hidden sm:inline">Назад</span>
          </button>

          <div className="text-center">
            <h1 className="font-heading font-bold text-lg">{plan.title}</h1>
            <p className="text-xs text-muted-foreground">
              {totalMinutes} мин • {completedCount}/{steps.length} станций
            </p>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Map Content */}
      <main className="map-container max-w-4xl mx-auto p-4 md:p-8">
        {/* Quote Card */}
        {quote && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-card to-background border border-border/40">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Мудрость дня
            </div>
            <div className="text-lg font-heading leading-tight">
              <div className="italic">{quote.kz}</div>
              <div className="mt-1 text-sm text-muted-foreground">{quote.ru}</div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="relative space-y-0">
          {/* Timeline line for desktop */}
          <div className="hidden md:block timeline-line left-[1.5rem] w-[2px]" />

          {steps.map((step, index) => {
            const config = typeConfig[step.type as StepType] ?? typeConfig.break;
            const isCompleted = completed[step.id];
            const isActive = activeId === step.id;

            return (
              <div
                key={step.id}
                className={`
                  station-card relative flex gap-4 md:pl-12 py-3
                  ${isCompleted ? "completed" : ""}
                  ${isActive ? "active" : ""}
                `}
              >
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0">
                  <button
                    onClick={() => toggleComplete(step.id)}
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      text-white font-bold text-sm shadow-lg
                      bg-gradient-to-br ${config.gradient}
                      ${isCompleted ? "ring-2 ring-offset-2 ring-offset-background ring-green-500" : ""}
                      transition-all duration-200 hover:scale-105
                    `}
                  >
                    {isCompleted ? (
                      <HugeiconsIcon icon={CheckmarkCircleIcon} strokeWidth={1.5} className="w-5 h-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </button>
                </div>

                {/* Card */}
                <button
                  onMouseDown={() => {
                    longPressTimerRef.current = setTimeout(() => {
                      setSelectedStep({ title: step.title, description: step.description || "", type: step.type as StepType, duration: step.duration });
                    }, 500);
                  }}
                  onMouseUp={() => {
                    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                  }}
                  onMouseLeave={() => {
                    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                  }}
                  onTouchStart={() => {
                    longPressTimerRef.current = setTimeout(() => {
                      setSelectedStep({ title: step.title, description: step.description || "", type: step.type as StepType, duration: step.duration });
                    }, 500);
                  }}
                  onTouchEnd={() => {
                    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                  }}
                  onClick={() => {
                    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                    toggleComplete(step.id);
                    setActiveId(step.id);
                    setTimeout(() => setActiveId(null), 600);
                  }}
                  className={`
                    flex-1 rounded-2xl p-4 text-left
                    border border-border/40 bg-card
                    hover:bg-card/80 hover:border-border/60
                    transition-all duration-200
                    ${isCompleted ? "opacity-60" : ""}
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-background/60">
                          {config.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {step.duration} мин
                        </span>
                      </div>
                      <h3 className="font-semibold text-base">{step.title}</h3>
                      {step.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          {Object.entries(typeConfig).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${cfg.bg}`} />
              <span>{cfg.label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Step Detail Popup */}
      {selectedStep && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedStep(null)}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div 
            className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl p-6 border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {typeConfig[selectedStep.type]?.label || "Задача"}
              </span>
              <span className="text-sm text-muted-foreground">
                {selectedStep.duration} мин
              </span>
            </div>
            <h3 className="font-heading text-xl font-bold mb-3">{selectedStep.title}</h3>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {selectedStep.description}
            </p>
            <Button 
              onClick={() => setSelectedStep(null)} 
              className="w-full mt-6"
            >
              Закрыть
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Action Bar - Mobile only */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background/90 backdrop-blur-md border-t border-border/40 p-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetAll} className="flex-1">
            Сброс
          </Button>
          <Button variant="outline" size="sm" onClick={markAll} className="flex-1">
            Всё
          </Button>
        </div>
      </div>

      {/* Desktop Action Buttons */}
      <div className="hidden md:flex fixed bottom-6 right-6 gap-2">
        <Button variant="outline" onClick={resetAll}>
          Сбросить
        </Button>
        <Button onClick={markAll}>
          Отметить всё
        </Button>
      </div>
    </div>
  );
}