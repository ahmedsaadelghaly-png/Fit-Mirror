"use client";

import { BusinessInfoForm } from "@/features/brand/components/profile/business-info-form";
import { NotificationPreferencesSection } from "@/features/brand/components/profile/notification-preferences-section";
import { StoreIdentitySection } from "@/features/brand/components/profile/store-identity-section";
import { VerificationStatusSection } from "@/features/brand/components/profile/verification-status-section";
import { RequireStore } from "@/features/brand/components/require-store";

function StoreProfileView() {
  return (
    <RequireStore>
      {(store) => (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-display text-2xl font-semibold">Store profile</h1>
            <p className="text-sm text-muted-foreground">
              How your store appears to shoppers, and your account preferences.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <StoreIdentitySection store={store} />
            <VerificationStatusSection isVerified={store.is_verified} />
          </div>

          <div className="max-w-2xl">
            <BusinessInfoForm />
          </div>

          <div className="max-w-2xl">
            <NotificationPreferencesSection />
          </div>
        </div>
      )}
    </RequireStore>
  );
}

export { StoreProfileView };
