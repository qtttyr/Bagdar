import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoonIcon, SunIcon } from "@hugeicons/core-free-icons";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const themeToggleVariants = cva(
  "inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-transparent hover:bg-background/80 text-foreground",
        ghost: "bg-transparent hover:bg-accent text-foreground",
        outline: "border border-border bg-transparent hover:bg-accent",
      },
      size: {
        default: "h-10 w-10",
        sm: "h-8 w-8",
        lg: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ThemeToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof themeToggleVariants> {
  theme?: "light" | "dark" | "system";
}

export const ThemeToggle = React.forwardRef<HTMLButtonElement, ThemeToggleProps>(
  ({ className, variant = "ghost", size = "sm", theme: initialTheme, ...props }, ref) => {
    const [theme, setTheme] = React.useState<"light" | "dark">("light");
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
      const stored = localStorage.getItem("theme") as "light" | "dark" | null;
      if (stored) {
        setTheme(stored);
        if (stored === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDark ? "dark" : "light");
        if (prefersDark) {
          document.documentElement.classList.add("dark");
        }
      }
    }, []);

    const toggleTheme = () => {
      const newTheme = theme === "light" ? "dark" : "light";
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    if (!mounted) return null;

    const Icon = theme === "dark" ? SunIcon : MoonIcon;

    return (
      <button
        ref={ref}
        onClick={toggleTheme}
        className={cn(themeToggleVariants({ variant, size, className }))}
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        {...props}
      >
        <HugeiconsIcon icon={Icon} strokeWidth={1.5} className="h-[1.2rem] w-[1.2rem]" />
      </button>
    );
  }
);
ThemeToggle.displayName = "ThemeToggle";