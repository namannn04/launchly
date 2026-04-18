"use client";

import { Search } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <label className="relative block w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search repositories..."
        className="h-11 w-full rounded-xl border border-border/70 bg-background/80 pl-10 pr-4 text-sm text-foreground outline-none transition-shadow focus-visible:shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"
      />
    </label>
  );
}
