import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type StepType = "learning" | "practice" | "break";

interface Step {
  id: string;
  title: string;
  duration: number;
  description?: string | null;
  type: StepType;
  order: number;
}

interface BreakItem {
  id: string;
  duration: number;
  message: string;
}

interface RoadmapResponse {
  id: string;
  title: string;
  total_duration: number;
  steps: Step[];
  breaks: BreakItem[];
  persona: string;
  created_at: string;
}

interface QuoteResponse {
  kz: string;
  ru: string;
}

interface RoadmapViewProps {
  plan: RoadmapResponse | null;
  quote?: QuoteResponse | null;
  onStationToggle?: (stepId: string) => void;
}

export default function RoadmapView({
  plan,
  quote,
  onStationToggle,
}: RoadmapViewProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [waveStyle, setWaveStyle] = useState<React.CSSProperties | null>(null);
  const [waveKey, setWaveKey] = useState(0);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  if (!plan) {
    return (
      <section className="w-full max-w-5xl mx-auto p-6">
        <div className="rounded-2xl bg-card p-8 shadow-lg ring-1 ring-foreground/8">
          <h3 className="font-heading text-2xl mb-2">
            Готово — начни своё путешествие
          </h3>
          <p className="text-muted-foreground">
            Создайте маршрут в генераторе, и он появится здесь как светящаяся
            карта — каждая станция оживает при клике.
          </p>
          <div className="mt-6 flex gap-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-chart-1 to-chart-3 shadow-inner" />
            <div className="flex-1">
              <div className="h-3 w-2/3 rounded bg-muted mb-2" />
              <div className="h-2 w-1/2 rounded bg-muted" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const steps = useMemo(() => {
    return [...plan.steps].sort((a, b) => a.order - b.order);
  }, [plan.steps]);

  const totalMinutes = plan.total_duration || steps.reduce((s, st) => s + st.duration, 0);

  const typeToColor = (type: StepType) => {
    switch (type) {
      case "learning":
        return "bg-gradient-to-br from-chart-1 to-chart-2 text-white";
      case "practice":
        return "bg-gradient-to-br from-chart-3 to-chart-4 text-white";
      case "break":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleStationClick = useCallback(
    (e: React.MouseEvent, step: Step) => {
      const target = e.currentTarget as HTMLButtonElement;
      if (!trackRef.current) return;

      const trackRect = trackRef.current.getBoundingClientRect();
      const btnRect = target.getBoundingClientRect();

      const startX = Math.max(
        0,
        Math.min(
          1,
          (btnRect.left + btnRect.width / 2 - trackRect.left) / trackRect.width
        )
      );

      const leftPercent = Math.round(startX * 100);
      setWaveStyle({
        left: `${leftPercent}%`,
      });
      setWaveKey((k) => k + 1);
      setActiveStationId(step.id);

      setCompleted((prev) => {
        const next = { ...prev, [step.id]: !prev[step.id] };
        return next;
      });

      onStationToggle?.(step.id);
    },
    [onStationToggle]
  );

  const handleStationKey = useCallback(
    (e: React.KeyboardEvent, step: Step) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const synthetic = (e.target as HTMLElement).closest("button");
        if (synthetic) {
          handleStationClick((e as unknown) as React.MouseEvent, step);
        }
      }
    },
    [handleStationClick]
  );

  useEffect(() => {
    if (!activeStationId) return;
    const id = window.setTimeout(() => {
      setActiveStationId(null);
      setWaveStyle(null);
    }, 900);
    return () => window.clearTimeout(id);
  }, [activeStationId, waveKey]);

  const stationMinWidth = 36;

  const computeWidths = (containerWidth: number) => {
    if (containerWidth <= 0) return steps.map(() => stationMinWidth);
    const scale = Math.max(1, containerWidth / Math.max(1, totalMinutes));
    return steps.map((s) =>
      Math.max(stationMinWidth, Math.round(s.duration * scale))
    );
  };

  const [stationWidths, setStationWidths] = useState<number[]>([]);
  useEffect(() => {
    const compute = () => {
      const w = trackRef.current?.clientWidth ?? 800;
      setStationWidths(computeWidths(w));
    };
    compute();
    const ro = new ResizeObserver(() => compute());
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [plan, steps.length, totalMinutes]);

  return (
    <section className="w-full mx-auto">
      <style>{`
        .wave {
          position: absolute;
          top: 0;
          height: 100%;
          width: 6px;
          transform: translateX(-50%) scaleX(0.2);
          pointer-events: none;
          border-radius: 999px;
          filter: blur(6px);
          opacity: 0.9;
          animation: waveMove 900ms ease-out forwards;
          background: linear-gradient(90deg, rgba(255,255,255,0.8), rgba(255,255,255,0.15));
          box-shadow: 0 0 24px rgba(255,255,255,0.14), 0 0 56px rgba(255,255,255,0.06);
          mix-blend-mode: screen;
        }

        @keyframes waveMove {
          0% { transform: translateX(-50%) scaleX(0.2); opacity: 0.9; }
          50% { transform: translateX(0%) scaleX(2.6); opacity: 0.6; }
          100% { transform: translateX(200%) scaleX(4.0); opacity: 0; }
        }

        .station-glow {
          transition: box-shadow 220ms ease, transform 180ms ease;
        }
        .station-glow:active {
          transform: translateY(1px) scale(0.995);
        }

        .station-active {
          box-shadow: 0 4px 30px rgba(110, 140, 255, 0.18), 0 1px 6px rgba(110,140,255,0.12);
          transform: scale(1.03);
        }

        .track {
          height: 6px;
          border-radius: 9999px;
          background: linear-gradient(90deg, rgba(255,255,255,0.03), rgba(0,0,0,0.02));
          position: relative;
        }
      `}</style>

      <div className="rounded-2xl bg-card p-6 shadow-lg ring-1 ring-foreground/8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl">{plan.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Всего: <strong>{totalMinutes} мин</strong> • Помеченные станции
              усиливают прогресс
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Persona</span>
            <div className="rounded-xl px-3 py-1 bg-background/60 ring-1 ring-foreground/6 text-sm">
              {plan.persona}
            </div>
          </div>
        </header>

        <main className="mt-6">
          <div className="relative flex flex-col gap-6">
            <div
              ref={trackRef}
              className="track w-full flex items-center gap-2 px-3 py-6 select-none"
              aria-hidden
            >
              {waveStyle && (
                <span key={waveKey} className="wave" style={waveStyle} />
              )}

              <div className="flex items-center gap-3 w-full overflow-auto py-2">
                {steps.map((s, i) => {
                  const widthPx = stationWidths[i] ?? stationMinWidth;
                  const colorClass = typeToColor(s.type);
                  const isActive = activeStationId === s.id;
                  const isCompleted = !!completed[s.id];

                  return (
                    <div key={s.id} className="flex flex-col items-center gap-3">
                      <button
                        onClick={(e) => handleStationClick(e, s)}
                        onKeyDown={(e) => handleStationKey(e, s)}
                        className={`station-glow relative flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${
                          isActive ? "station-active" : ""
                        }`}
                        aria-pressed={isCompleted}
                        aria-label={`${s.title} — ${s.duration} минут — ${s.type}`}
                        title={`${s.title} — ${s.duration} мин`}
                        style={{
                          width: Math.max(stationMinWidth, widthPx),
                          height: 56,
                        }}
                      >
                        <div
                          className={`flex h-10 w-full items-center justify-center rounded-lg px-3 ${colorClass}`}
                          style={{
                            boxShadow: isCompleted
                              ? "inset 0 -6px 18px rgba(0,0,0,0.08), 0 6px 18px rgba(16,24,40,0.06)"
                              : undefined,
                          }}
                        >
                          <div className="flex flex-col items-start gap-0">
                            <span
                              className="text-sm font-medium leading-tight truncate"
                              style={{ maxWidth: widthPx - 36 }}
                            >
                              {s.title}
                            </span>
                            <span className="text-xs opacity-80 -mt-0.5">
                              {s.duration} мин
                            </span>
                          </div>
                        </div>

                        <div
                          className={`absolute -right-2 -top-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            isCompleted
                              ? "bg-primary text-primary-foreground ring-1 ring-foreground/7"
                              : "bg-background text-muted-foreground ring-1 ring-foreground/6"
                          }`}
                          aria-hidden
                        >
                          {isCompleted ? "✓" : "+"}
                        </div>
                      </button>

                      <div className="text-xs text-muted-foreground max-w-[140px] text-center">
                        {s.type === "break"
                          ? s.description ?? "Отдых"
                          : s.description ?? "Учебная станция"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-8 rounded-full bg-chart-1 shadow-sm" />
                <span className="text-xs text-muted-foreground">Learning</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-8 rounded-full bg-chart-3 shadow-sm" />
                <span className="text-xs text-muted-foreground">Practice</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-8 rounded-full bg-muted shadow-sm" />
                <span className="text-xs text-muted-foreground">Break</span>
              </div>

              <div className="ml-auto text-xs text-muted-foreground">
                Кликните станцию, чтобы отправить «Импульс»
              </div>
            </div>
          </div>
        </main>

        {quote && (
          <footer className="mt-6 rounded-lg border border-border/40 bg-background/50 p-4 flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-medium text-muted-foreground">
                Мудрость дня
              </div>
              <div className="mt-2 text-lg font-heading leading-tight">
                <div className="italic">{quote.kz}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {quote.ru}
                </div>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <button
                onClick={() => {
                  setCompleted({});
                }}
                className="rounded-md px-3 py-1 bg-primary text-primary-foreground text-sm"
              >
                Сбросить метки
              </button>

              <button
                onClick={() => {
                  const all = Object.fromEntries(
                    plan.steps.map((s) => [s.id, true])
                  );
                  setCompleted(all);
                }}
                className="rounded-md px-3 py-1 bg-secondary text-secondary-foreground text-sm"
              >
                Отметить всё
              </button>
            </div>
          </footer>
        )}
      </div>
    </section>
  );
}
