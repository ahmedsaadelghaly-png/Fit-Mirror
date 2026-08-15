"use client";

import { shopperNav } from "@/config/navigation";
import { DashboardHeader } from "@/layouts/dashboard-header";
import { DashboardSidebar } from "@/layouts/dashboard-sidebar";

function ShopperDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <DashboardSidebar navItems={shopperNav} areaLabel="Shopper" />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          navItems={shopperNav}
          areaLabel="Shopper"
          breadcrumbs={[{ label: "Shopper" }]}
        />
        <main id="main-content" className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export { ShopperDashboardLayout };
