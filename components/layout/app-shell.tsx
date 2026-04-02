"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { SiteHeader } from "@/components/layout/Navbar";
import { SiteSidebar } from "@/components/layout/site-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = ["/dashboard", "/projects", "/deployments", "/settings"].some(
    (route) => pathname.startsWith(route)
  );

  return (
    <div className="relative min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        {showSidebar ? <SiteSidebar /> : null}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
