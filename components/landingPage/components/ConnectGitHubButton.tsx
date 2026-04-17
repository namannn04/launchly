"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConnectGitHubButtonProps = {
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "outline" | "ghost";
  className?: string;
};

export default function ConnectGitHubButton({
  size = "default",
  variant = "default",
  className,
}: ConnectGitHubButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const githubIcon = (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M12 2a10 10 0 0 0-3.162 19.488c.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.699-2.776.603-3.362-1.338-3.362-1.338-.454-1.155-1.109-1.463-1.109-1.463-.908-.62.069-.608.069-.608 1.004.071 1.532 1.031 1.532 1.031.893 1.53 2.343 1.088 2.914.832.091-.647.35-1.088.636-1.338-2.217-.252-4.55-1.109-4.55-4.938 0-1.091.39-1.983 1.03-2.682-.103-.253-.447-1.269.098-2.645 0 0 .84-.269 2.75 1.025A9.59 9.59 0 0 1 12 6.844c.852.004 1.711.115 2.513.337 1.909-1.294 2.748-1.025 2.748-1.025.546 1.376.202 2.392.1 2.645.64.699 1.028 1.59 1.028 2.682 0 3.838-2.337 4.683-4.561 4.93.359.309.679.92.679 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.58.688.481A10 10 0 0 0 12 2Z" />
    </svg>
  );

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={isLoading}
      className={cn("gap-2", className)}
      onClick={() => {
        setIsLoading(true);
        window.location.href = "/api/github/connect";
      }}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : githubIcon}
      {isLoading ? "Connecting..." : "Connect GitHub"}
    </Button>
  );
}
