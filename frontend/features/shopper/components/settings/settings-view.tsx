"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  ChangePasswordCard,
  DeleteAccountCard,
  ProfileDetailsCard,
} from "@/features/auth/components/account-settings";
import { NotificationPreferencesSection } from "@/features/shopper/components/settings/notification-preferences-section";
import { ThemePreferenceShortcut } from "@/features/shopper/components/settings/theme-preference-shortcut";
import { useAuth } from "@/hooks/use-auth";

function SettingsView() {
  const { currentUser } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {currentUser ? (
          <ProfileDetailsCard user={currentUser} />
        ) : (
          <Skeleton className="h-48 w-full" />
        )}
        <ThemePreferenceShortcut />
        <ChangePasswordCard />
        <NotificationPreferencesSection />
        <DeleteAccountCard />
      </div>
    </div>
  );
}

export { SettingsView };
