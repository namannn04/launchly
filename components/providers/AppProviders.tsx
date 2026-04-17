import { StackProvider, StackTheme } from "@stackframe/stack";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { stackServerApp } from "@/stack/server";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <StackProvider app={stackServerApp}>
        <StackTheme>{children}</StackTheme>
      </StackProvider>
    </ThemeProvider>
  );
}
