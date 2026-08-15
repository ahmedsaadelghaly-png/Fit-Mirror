"use client";

import { brandNav } from "@/config/navigation";
import { DashboardHeader } from "@/layouts/dashboard-header";
import { DashboardSidebar } from "@/layouts/dashboard-sidebar";

function BrandDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <DashboardSidebar navItems={brandNav} areaLabel="Brand" />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader navItems={brandNav} areaLabel="Brand" breadcrumbs={[{ label: "Brand" }]} />
        <main id="main-content" className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export { BrandDashboardLayout };
