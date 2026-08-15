import type { NavItem } from "@/config/navigation";
import { MobileNav } from "@/layouts/mobile-nav";
import type { BreadcrumbItem } from "@/shared/components/breadcrumbs";
import { Breadcrumbs } from "@/shared/components/breadcrumbs";
import { NotificationBell } from "@/shared/components/notification-bell";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { UserMenu } from "@/shared/components/user-menu";

export interface DashboardHeaderProps {
  navItems: NavItem[];
  areaLabel: string;
  breadcrumbs?: BreadcrumbItem[];
}

/**
 * Shared header for all three dashboard layouts. Composition, not
 * business logic — every piece (breadcrumbs, notifications, theme,
 * account menu) is its own component so each can evolve independently.
 */
function DashboardHeader({ navItems, areaLabel, breadcrumbs = [] }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-surface/80 px-4 backdrop-blur md:px-6">
      <MobileNav navItems={navItems} areaLabel={areaLabel} />
      <div className="flex-1">
        <Breadcrumbs items={breadcrumbs} />
      </div>
      <div className="flex items-center gap-1">
        <NotificationBell />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

export { DashboardHeader };
