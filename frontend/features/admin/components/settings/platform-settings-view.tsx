"use client";

import { Bell, Brain, HardDrive, Settings, Shield } from "lucide-react";

import { AdminGuard } from "@/features/admin/components/admin-guard";
import { PlannedSettingsCard } from "@/features/admin/components/settings/planned-settings-card";

function PlatformSettingsView() {
  return (
    <AdminGuard>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Platform settings</h1>
          <p className="text-sm text-muted-foreground">
            Platform-wide configuration — none of this is backed by a real endpoint yet.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <PlannedSettingsCard
            icon={Settings}
            title="General"
            description="Platform name, default locale, and support contact."
          />
          <PlannedSettingsCard
            icon={Shield}
            title="Security"
            description="Password policy, session timeout, and rate limiting."
          />
          <PlannedSettingsCard
            icon={HardDrive}
            title="Storage"
            description="Object storage provider, retention, and quotas."
          />
          <PlannedSettingsCard
            icon={Brain}
            title="AI"
            description="Default model, inference timeout, and fallback behavior."
          />
          <PlannedSettingsCard
            icon={Bell}
            title="Notifications"
            description="Platform-wide alert thresholds and delivery channels."
          />
        </div>
      </div>
    </AdminGuard>
  );
}

export { PlatformSettingsView };
