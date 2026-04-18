import { useEffect, useState } from "react";

type DarkModeState = "light" | "dark" | "system";

export function useDarkMode() {
  const [theme, setTheme] = useState<DarkModeState>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as DarkModeState | null;
    if (stored) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "system";
      return "light";
    });
  };

  return { theme, setTheme, toggleTheme };
}