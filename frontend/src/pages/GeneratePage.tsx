import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import type { RoadmapRequest } from "@/types/api";
import { generateRoadmap } from "@/lib/api";
import { usePlans } from "@/hooks/use-plans";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

export default function GeneratePage() {
  const navigate = useNavigate();
  const { savePlan } = usePlans();

  const [rawTopics, setRawTopics] = useState("физика, FastAPI");
  const [duration, setDuration] = useState(180);
  const [persona, setPersona] = useState<"aksakal" | "abay" | "nomad">("abay");
  const [level, setLevel] = useState("beginner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topics = useMemo(() => {
    return rawTopics
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [rawTopics]);

  const onGenerate = useCallback(async () => {
    setError(null);

    if (topics.length === 0) {
      setError("Добавьте хотя бы одну тему для обучения");
      return;
    }

    if (duration <= 0 || duration > 480) {
      setError("Продолжительность должна быть от 1 до 480 минут");
      return;
    }

    const payload: RoadmapRequest = {
      topics,
      duration_minutes: duration,
      persona,
      level,
    };

    setLoading(true);
    try {
      const res = await generateRoadmap(payload);
      savePlan(res);
      navigate("/map", { state: { plan: res.plan, quote: res.quote } });
    } catch (err: any) {
      setError(err?.message || "Ошибка при подключении к серверу. Проверьте, запущен ли бэкенд.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [topics, duration, persona, level, navigate, savePlan]);

  const onBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const getPersonaDesc = (p: string) => {
    switch (p) {
      case "aksakal": return "Строгий график, короткие перерывы, мудрые наставления";
      case "abay": return "Сбалансированный темп, философские цитаты, упор на понимание";
      case "nomad": return "Быстрые спринты, советы по биохакингу, современный стиль";
      default: return "";
    }
  };

  const personaNames = {
    aksakal: "Строгий Аксакал",
    abay: "Мудрый Абай",
    nomad: "Современный Номад",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.5} className="w-4 h-4" />
            Назад
          </button>
          <h1 className="font-heading font-bold">Новый маршрут</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto p-6">
          <Card className="shadow-lg border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <HugeiconsIcon icon={SparklesIcon} strokeWidth={1.5} className="w-5 h-5 text-primary" />
                Создать маршрут
              </CardTitle>
              <CardDescription>Введите параметры вашей сессии обучения</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Topics */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Темы для изучения
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Разделите запятой или новой строкой
                </p>
                <textarea
                  value={rawTopics}
                  onChange={(e) => setRawTopics(e.target.value)}
                  className="w-full h-24 resize-none rounded-lg border border-border/60 bg-background/50 p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                  placeholder="Например: Физика, FastAPI, React"
                />
                <div className="text-xs text-muted-foreground">
                  {topics.length} тем{topics.length !== 1 ? "" : "а"}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Продолжительность сессии
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="480"
                    value={duration}
                    onChange={(e) => setDuration(Math.min(480, Math.max(1, Number(e.target.value))))}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground font-medium">минут</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[30, 60, 120, 180, 240, 360].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition ${
                        duration === d
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                      }`}
                    >
                      {d} мин
                    </button>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Уровень подготовки
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                >
                  <option value="beginner">Начинающий</option>
                  <option value="intermediate">Промежуточный</option>
                  <option value="advanced">Продвинутый</option>
                </select>
              </div>

              {/* Persona */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Голос наставника
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Выберите стиль планирования
                </p>
                <div className="space-y-2">
                  {(["aksakal", "abay", "nomad"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPersona(p)}
                      className={`w-full p-4 rounded-xl border-2 transition text-left ${
                        persona === p
                          ? "border-primary bg-primary/5"
                          : "border-border/40 bg-background/40 hover:border-border/60 hover:bg-background/60"
                      }`}
                    >
                      <div className="font-semibold">{personaNames[p]}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {getPersonaDesc(p)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                  {error}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex gap-3 pt-4 border-t border-border/30">
              <Button variant="outline" onClick={onBack} className="flex-1">
                Отмена
              </Button>
              <Button
                onClick={onGenerate}
                disabled={loading || topics.length === 0}
                className="flex-1 gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    Генерируем...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={SparklesIcon} strokeWidth={1.5} className="w-4 h-4" />
                    Создать
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}