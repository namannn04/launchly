"use client";

import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useMounted } from "@/hooks/useMounted";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const effectiveTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = effectiveTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative inline-flex h-10 w-19 items-center rounded-full border border-border/70 bg-muted/60 p-1 shadow-inner"
    >
      <span className="pointer-events-none flex w-full items-center justify-between px-1 text-muted-foreground">
        <Sun className={cn("h-4 w-4", !mounted ? "opacity-80" : isDark ? "opacity-40" : "opacity-100")} />
        <Moon className={cn("h-4 w-4", !mounted ? "opacity-40" : isDark ? "opacity-100" : "opacity-40")} />
      </span>

      <motion.span
        initial={false}
        animate={{
          x: mounted && isDark ? 36 : 0,
          rotate: mounted && isDark ? 180 : 0,
        }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        className="absolute left-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground shadow-[0_8px_20px_rgba(15,23,42,0.18)]"
      >
        {mounted && isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </motion.span>
    </button>
  );
}
