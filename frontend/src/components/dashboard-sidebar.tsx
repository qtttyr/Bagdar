import { HugeiconsIcon } from "@hugeicons/react";
import {
  AddIcon,
  DeleteIcon,
  ArrowLeft02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SavedPlan } from "@/hooks/use-plans";

interface DashboardSidebarProps {
  plans: SavedPlan[];
  currentPlanId?: string;
  onSelectPlan: (plan: SavedPlan) => void;
  onDeletePlan: (id: string) => void;
  onNewPlan: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function DashboardSidebar({
  plans,
  currentPlanId,
  onSelectPlan,
  onDeletePlan,
  onNewPlan,
  isOpen = false,
  onToggle,
  className,
}: DashboardSidebarProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-40 w-72 md:w-64 flex flex-col bg-card border-r border-border transition-transform duration-300",
          "max-w-[85vw]",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="font-heading font-bold text-white text-lg">B</span>
            </div>
            <div>
              <h1 className="font-heading font-bold">Baǵdar</h1>
              <p className="text-xs text-muted-foreground">Мои маршруты</p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onToggle}
            className="md:hidden w-8 h-8 rounded-lg hover:bg-background/50 flex items-center justify-center"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={1.5} className="w-5 h-5" />
          </button>
        </div>

        {/* New Plan Button */}
        <div className="p-3 border-b border-border">
          <Button onClick={onNewPlan} className="w-full gap-2">
            <HugeiconsIcon icon={AddIcon} strokeWidth={1.5} className="w-4 h-4" />
            Новый план
          </Button>
        </div>

        {/* Plans list */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase">
              Маршруты ({plans.length})
            </p>
            {plans.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                Пока нет маршрутов
              </div>
            ) : (
              <div className="space-y-1">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={cn(
                      "group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition",
                      currentPlanId === plan.id
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-background/50 border border-transparent"
                    )}
                  >
                    <button
                      onClick={() => {
                        onSelectPlan(plan);
                        onToggle?.();
                      }}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="font-medium text-sm truncate">{plan.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {plan.total_duration} мин • {formatDate(plan.createdAt)}
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePlan(plan.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 transition"
                      title="Удалить"
                    >
                      <HugeiconsIcon
                        icon={DeleteIcon}
                        strokeWidth={1.5}
                        className="w-4 h-4 text-destructive"
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            {plans.length} маршрут{plans.length === 1 ? "" : "ов"}
          </p>
        </div>
      </aside>
    </>
  );
}