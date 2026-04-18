"use client";

import { Check, ChevronDown, Plus } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type GitProvider = {
  login: string;
  avatarUrl: string | null;
  type: "User" | "Organization";
};

type GitProviderSelectProps = {
  providers: GitProvider[];
  selectedProvider: string | null;
  onChange: (login: string) => void;
};

export default function GitProviderSelect({ providers, selectedProvider, onChange }: GitProviderSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentClick);

    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
    };
  }, []);

  const selected = providers.find((provider) => provider.login === selectedProvider) ?? providers[0] ?? null;

  const githubIcon = (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M12 2a10 10 0 0 0-3.162 19.488c.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.699-2.776.603-3.362-1.338-3.362-1.338-.454-1.155-1.109-1.463-1.109-1.463-.908-.62.069-.608.069-.608 1.004.071 1.532 1.031 1.532 1.031.893 1.53 2.343 1.088 2.914.832.091-.647.35-1.088.636-1.338-2.217-.252-4.55-1.109-4.55-4.938 0-1.091.39-1.983 1.03-2.682-.103-.253-.447-1.269.098-2.645 0 0 .84-.269 2.75 1.025A9.59 9.59 0 0 1 12 6.844c.852.004 1.711.115 2.513.337 1.909-1.294 2.748-1.025 2.748-1.025.546 1.376.202 2.392.1 2.645.64.699 1.028 1.59 1.028 2.682 0 3.838-2.337 4.683-4.561 4.93.359.309.679.92.679 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.58.688.481A10 10 0 0 0 12 2Z" />
    </svg>
  );

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex h-11 min-w-72 items-center justify-between rounded-xl border border-border/70 bg-background/80 px-3 text-sm"
      >
        <span className="inline-flex items-center gap-2 truncate">
          {selected?.avatarUrl ? (
            <Image src={selected.avatarUrl} alt={selected.login} width={16} height={16} className="h-4 w-4 rounded-full" />
          ) : (
            githubIcon
          )}
          <span className="truncate">{selected?.login ?? "Select account"}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-80 rounded-2xl border border-border/70 bg-background/95 p-2 shadow-[0_20px_45px_rgba(15,23,42,0.2)] backdrop-blur">
          <div className="max-h-64 overflow-y-auto">
            {providers.map((provider) => {
              const isSelected = provider.login === selectedProvider;

              return (
                <button
                  type="button"
                  key={provider.login}
                  onClick={() => {
                    onChange(provider.login);
                    setIsOpen(false);
                  }}
                  className={isSelected
                    ? "mb-1 flex w-full items-center justify-between rounded-xl bg-muted px-3 py-2 text-left"
                    : "mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-muted/70"}
                >
                  <span className="inline-flex items-center gap-2 text-sm">
                    {provider.avatarUrl ? (
                      <Image src={provider.avatarUrl} alt={provider.login} width={16} height={16} className="h-4 w-4 rounded-full" />
                    ) : (
                      githubIcon
                    )}
                    {provider.login}
                  </span>
                  {isSelected ? <Check className="h-4 w-4" /> : null}
                </button>
              );
            })}
          </div>

          <div className="mt-2 border-t border-border/60 pt-2">
            <a
              href="/api/github/connect"
              className="mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted/70"
            >
              <Plus className="h-4 w-4" />
              Add GitHub Account
            </a>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted/70"
            >
              {githubIcon}
              Switch Git Provider
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export type { GitProvider };
