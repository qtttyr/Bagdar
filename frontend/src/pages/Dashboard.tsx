import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { usePlans, type SavedPlan } from "@/hooks/use-plans";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { RoadmapMiniView } from "@/components/roadmap-mini-view";

export default function Dashboard() {
  const navigate = useNavigate();
  const { plans, loaded, deletePlan } = usePlans();
  const [currentPlan, setCurrentPlan] = useState<SavedPlan | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleNewPlan = useCallback(() => {
    navigate("/generate");
  }, [navigate]);

  const handleSelectPlan = useCallback((plan: SavedPlan) => {
    setCurrentPlan(plan);
    if (isMobile) setSidebarOpen(false);
    navigate("/map", { state: { plan, quote: plan.quote } });
  }, [navigate, isMobile]);

  const handleDeletePlan = useCallback((id: string) => {
    if (confirm("Удалить этот маршрут?")) {
      deletePlan(id);
    }
  }, [deletePlan]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const displayPlan = currentPlan || plans[0] || null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <DashboardSidebar
        plans={plans}
        currentPlanId={displayPlan?.id}
        onSelectPlan={handleSelectPlan}
        onDeletePlan={handleDeletePlan}
        onNewPlan={handleNewPlan}
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
        className="fixed inset-y-0 left-0 z-40"
      />

      {/* Main content */}
      <div className="flex-1 md:ml-0 transition-all duration-300 w-full">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Mobile menu button */}
            {isMobile ? (
              <button
                onClick={handleToggleSidebar}
                className="w-11 h-11 rounded-xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
              >
                <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} className="w-5 h-5" />
              </button>
            ) : <div className="w-0" />}
            
            <h1 className="font-heading text-lg md:text-xl font-bold truncate flex-1 text-center px-2">
              {displayPlan ? displayPlan.title : "Мои маршруты"}
            </h1>
            
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <main className="p-4 md:p-6">
          {displayPlan ? (
            <div className="space-y-6">
              {/* Plan header */}
              <div className="flex flex-col gap-3">
                <div>
                  <h2 className="font-heading text-2xl md:text-3xl font-bold leading-tight">
                    {displayPlan.title}
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {displayPlan.total_duration} мин • {displayPlan.steps.length} этапов • {displayPlan.persona}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => handleSelectPlan(displayPlan)}>
                    Открыть карту
                  </Button>
                </div>
              </div>

              {/* Mini roadmap view */}
              <RoadmapMiniView plan={displayPlan} />

              {/* Quote */}
              {displayPlan.quote && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-card to-background border border-border/40">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Мудрость дня
                  </div>
                  <div className="text-lg font-heading leading-tight">
                    <div className="italic">{displayPlan.quote.kz}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {displayPlan.quote.ru}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full blur-2xl opacity-20" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={1.5} className="w-10 h-10 text-white" />
                </div>
              </div>

              <div>
                <h2 className="font-heading text-2xl font-bold mb-2">Нет маршрутов</h2>
                <p className="text-muted-foreground max-w-md">
                  Создайте свой первый маршрут обучения, и он появится здесь.
                </p>
              </div>

              <Button size="lg" onClick={handleNewPlan} className="gap-2">
                <HugeiconsIcon icon={Add01Icon} strokeWidth={1.5} className="w-5 h-5" />
                Создать маршрут
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}