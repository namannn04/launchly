"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        aria-label="Theme toggle"
      >
        <Monitor />
      </Button>
    );
  }

  return (
    <div className="flex items-center rounded-full border border-border bg-background p-1">
      <Button
        size="icon-sm"
        variant={resolvedTheme === "light" ? "secondary" : "ghost"}
        className="rounded-full"
        onClick={() => setTheme("light")}
        aria-label="Switch to light theme"
      >
        <Sun />
      </Button>
      <Button
        size="icon-sm"
        variant={resolvedTheme === "dark" ? "secondary" : "ghost"}
        className="rounded-full"
        onClick={() => setTheme("dark")}
        aria-label="Switch to dark theme"
      >
        <Moon />
      </Button>
    </div>
  );
}
