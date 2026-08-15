"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { NavItem } from "@/config/navigation";
import { useUIStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";
import { Logo } from "@/shared/components/logo";

export interface DashboardSidebarProps {
  navItems: NavItem[];
  /** Short label shown under the logo, e.g. "Shopper", "Brand", "Admin". */
  areaLabel: string;
}

/**
 * Shared sidebar shell for all three dashboard layouts (Shopper/Brand/
 * Admin) — the nav items differ (see config/navigation.ts) but the
 * collapse behavior, active-link styling, and "coming soon" treatment are
 * identical, so they live here once instead of being copy-pasted three
 * times.
 */
function DashboardSidebar({ navItems, areaLabel }: DashboardSidebarProps) {
  const pathname = usePathname();
  const isCollapsed = useUIStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r bg-surface transition-[width] duration-200 ease-signature md:flex",
        isCollapsed ? "w-[68px]" : "w-64",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <Logo className="text-base" />
            <span className="truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {areaLabel}
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="shrink-0"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label={`${areaLabel} navigation`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.comingSoon) {
            return (
              <span
                key={item.href}
                aria-disabled="true"
                title="Coming soon"
                className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/60"
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {!isCollapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    <span className="ml-auto rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                      Soon
                    </span>
                  </>
                )}
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn("size-4 shrink-0", isActive && "text-primary-text")}
                aria-hidden="true"
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export { DashboardSidebar };
