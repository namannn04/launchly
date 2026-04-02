import Link from "next/link";
import { FolderGit2, LayoutDashboard, Rocket, Settings } from "lucide-react";

const sidebarItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderGit2 },
  { href: "/deployments", label: "Deployments", icon: Rocket },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SiteSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/80 bg-muted/20 px-4 py-6 lg:block">
      <p className="mb-6 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Workspace
      </p>
      <nav className="flex flex-col gap-1.5">
        {sidebarItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
