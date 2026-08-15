"use client";

import { adminNav } from "@/config/navigation";
import { DashboardHeader } from "@/layouts/dashboard-header";
import { DashboardSidebar } from "@/layouts/dashboard-sidebar";

function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <DashboardSidebar navItems={adminNav} areaLabel="Admin" />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader navItems={adminNav} areaLabel="Admin" breadcrumbs={[{ label: "Admin" }]} />
        <main id="main-content" className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export { AdminDashboardLayout };
