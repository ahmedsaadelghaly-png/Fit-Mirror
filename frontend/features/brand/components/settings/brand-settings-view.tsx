"use client";

import { CreditCard, Plug, Store as StoreIcon, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountSettingsSection } from "@/features/brand/components/settings/account-settings-section";
import { PlannedSectionCard } from "@/features/brand/components/settings/planned-section-card";
import { useAuth } from "@/hooks/use-auth";

function BrandSettingsView() {
  const { currentUser } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account, store, and integrations.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {currentUser ? (
          <AccountSettingsSection user={currentUser} />
        ) : (
          <Skeleton className="h-48 w-full" />
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <StoreIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle className="text-base">Store settings</CardTitle>
            </div>
            <CardDescription>Logo, category, description, and social links.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/brand/profile">Go to store profile</Link>
            </Button>
          </CardContent>
        </Card>

        <PlannedSectionCard
          icon={CreditCard}
          title="Billing"
          description="Subscription plan, payment method, and invoices."
          emptyStateTitle="No billing information yet"
        />
        <PlannedSectionCard
          icon={Users}
          title="Team management"
          description="Invite teammates to help manage your store."
          emptyStateTitle="No team members yet"
        />
        <PlannedSectionCard
          icon={Plug}
          title="API integration"
          description="API keys and webhooks for connecting external tools."
          emptyStateTitle="No API keys yet"
        />
      </div>
    </div>
  );
}

export { BrandSettingsView };
