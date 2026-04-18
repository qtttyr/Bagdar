import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RoadmapRequest, GenerateResponse } from "@/types/api";
import { generateRoadmap } from "@/lib/api";
import RoadmapView from "@/components/RoadmapView";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function GeneratorPage() {
  const navigate = useNavigate();
  const [rawTopics, setRawTopics] = useState("физика, FastAPI");
  const [duration, setDuration] = useState(180);
  const [persona, setPersona] = useState<"aksakal" | "abay" | "nomad">("abay");
  const [level, setLevel] = useState("beginner");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  const topics = useMemo(() => {
    return rawTopics
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [rawTopics]);

  const onGenerate = useCallback(async () => {
    setError(null);
    setResult(null);

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
      setResult(res);
      navigate("/map", { state: { plan: res.plan, quote: res.quote } });
    } catch (err: any) {
      setError(err?.message || "Ошибка при подключении к серверу. Проверьте, запущен ли бэкенд.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [topics, duration, persona, level, navigate]);

  const onReset = useCallback(() => {
    setRawTopics("физика, FastAPI");
    setDuration(180);
    setPersona("abay");
    setLevel("beginner");
    setError(null);
    setResult(null);
  }, []);

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
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/40 bg-card/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <span className="font-heading font-bold text-white text-lg">B</span>
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold">Baǵdar</h1>
              <p className="text-xs text-muted-foreground">AI-powered learning routes</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <aside>
              <Card className="sticky top-20 shadow-lg border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Создать маршрут</CardTitle>
                  <CardDescription>Введите параметры вашей сессии обучения</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Темы для изучения</label>
                    <p className="text-xs text-muted-foreground mb-2">Разделите запятой или новой строкой</p>
                    <textarea
                      value={rawTopics}
                      onChange={(e) => setRawTopics(e.target.value)}
                      className="w-full h-24 resize-none rounded-lg border border-border/60 bg-background/50 p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                      placeholder="Например: Физика, FastAPI, React"
                    />
                    <div className="text-xs text-muted-foreground">{topics.length} тем{topics.length !== 1 ? "ы" : "а"}</div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Продолжительность сессии</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number" min="1" max="480"
                        value={duration}
                        onChange={(e) => setDuration(Math.min(480, Math.max(1, Number(e.target.value))))}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground font-medium">минут</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[30, 60, 120, 180, 240, 360].map((d) => (
                        <button key={d} onClick={() => setDuration(d)}
                          className={`px-2 py-1 text-xs rounded-md transition ${duration === d ? "bg-primary text-primary-foreground" : "bg-background border border-border/60 text-muted-foreground hover:text-foreground"}`}>
                          {d}м
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Уровень подготовки</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition">
                      <option value="beginner">Начинающий</option>
                      <option value="intermediate">Промежуточный</option>
                      <option value="advanced">Продвинутый</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Голос наставника</label>
                    <p className="text-xs text-muted-foreground mb-2">Выберите стиль планирования</p>
                    <div className="space-y-2">
                      {(["aksakal", "abay", "nomad"] as const).map((p) => (
                        <button key={p} onClick={() => setPersona(p)}
                          className={`w-full p-3 rounded-lg border-2 transition text-left ${persona === p ? "border-primary bg-primary/8" : "border-border/40 bg-background/40 hover:border-border/60 hover:bg-background/60"}`}>
                          <div className="font-semibold text-sm">{personaNames[p]}</div>
                          <div className="text-xs text-muted-foreground mt-1">{getPersonaDesc(p)}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive"> {error}</div>
                  )}
                </CardContent>

                <CardFooter className="flex gap-2 pt-4 border-t border-border/30">
                  <Button variant="outline" onClick={onReset} disabled={loading} className="flex-1">Сброс</Button>
                  <Button onClick={onGenerate} disabled={loading || topics.length === 0} className="flex-1 gap-2">
                    {loading ? "Генерируем..." : "Сгенерировать"}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="mt-6 border-border/40 bg-card/50">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Советы степной паузы</CardTitle></CardHeader>
                <CardContent className="text-xs space-y-2 text-muted-foreground">
                  <p><strong>После 45 мин:</strong> посмотрите в горизонт, дайте глазам отдохнуть.</p>
                  <p><strong>Много практики?</strong> Делайте короткие 5-мин перерывы.</p>
                  <p><strong>Абай говорит:</strong> глубокое чтение требует времени и спокойствия.</p>
                </CardContent>
              </Card>
            </aside>

            <main>
              {result ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <div>
                      <h2 className="font-heading text-3xl font-bold leading-tight">{result.plan.title}</h2>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {result.plan.total_duration} мин • {result.plan.steps.length} этапов • {personaNames[result.plan.persona as "aksakal" | "abay" | "nomad"]}
                      </p>
                    </div>
                  </div>
                  <RoadmapView plan={result.plan} quote={result.quote} />
                  <div className="flex gap-3 flex-wrap">
                    <Button variant="outline" className="gap-2">Скачать план</Button>
                    <Button variant="outline" className="gap-2">Поделиться</Button>
                    <Button variant="outline" className="gap-2">Сохранить</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-gradient-to-br from-card to-background border border-border/40 p-8 lg:p-12">
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full blur-2xl opacity-20" />
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                          <span className="text-4xl">B</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-heading text-2xl font-bold mb-2">Готово для маршрута?</h3>
                        <p className="text-muted-foreground max-w-md">
                          Заполните форму слева, и AI создаст для вас красивую интерактивную карту обучения.
                        </p>
                      </div>
                      <div className="mt-6 pt-6 border-t border-border/40 w-full">
                        <p className="text-xs text-muted-foreground mb-4">Пример: Так будет выглядеть ваш маршрут</p>
                        <div className="flex flex-col gap-3">
                          {["Введение", "Основы", "Практика", "Проверка"].map((step, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background/40">
                              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                                style={{ background: ["linear-gradient(135deg, #8B5CF6, #7C3AED)", "linear-gradient(135deg, #06B6D4, #0891B2)", "linear-gradient(135deg, #F59E0B, #DC2626)", "linear-gradient(135deg, #10B981, #059669)"][i] }}>
                                {i + 1}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-sm">{step}</div>
                                <div className="text-xs text-muted-foreground">{45 + i * 15} мин</div>
                              </div>
                              <div className="text-2xl">→</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="bg-card/50 border-border/40">
                      <CardHeader><CardTitle className="text-sm">Как это работает?</CardTitle></CardHeader>
                      <CardContent className="text-xs text-muted-foreground">
                        Введите темы, время и уровень. Baǵdar использует AI, чтобы создать оптимальный расписание.
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border/40">
                      <CardHeader><CardTitle className="text-sm">Типы станций</CardTitle></CardHeader>
                      <CardContent className="text-xs text-muted-foreground">
                        <strong>Обучение:</strong> те��рия • <strong>Практика:</strong> упражнения • <strong>Пауза:</strong> отдых
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 bg-card/20 py-6 mt-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          <p>Baǵdar — степная мудрость встречает современный AI.<br />
            <span className="text-xs">Создано для тех, кто ценит красоту в процессе обучения.</span>
          </p>
        </div>
      </footer>
    </div>
  );
}