import { CircleCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { User } from "@/types/domain";

export interface WelcomeSummaryCardProps {
  user: User;
  isOnboardingComplete: boolean;
}

function WelcomeSummaryCard({ user, isOnboardingComplete }: WelcomeSummaryCardProps) {
  const firstName = (user.full_name ?? user.email).split(/[\s@]/)[0];

  return (
    <Card variant="elevated">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <h1 className="font-display text-2xl font-semibold">Welcome back, {firstName}</h1>
          <p className="text-sm text-muted-foreground">
            Your wardrobe and try-on activity, all in one place.
          </p>
        </div>
        {isOnboardingComplete ? (
          <Badge variant="success" className="shrink-0">
            <CircleCheck className="size-3.5" /> Profile set up
          </Badge>
        ) : (
          <Button asChild size="sm" className="shrink-0">
            <Link href="/shopper/onboarding">Finish setup</Link>
          </Button>
        )}
      </CardHeader>
      {!isOnboardingComplete && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            Add your style preferences and body profile so try-on results and recommendations fit
            you better.
          </p>
        </CardContent>
      )}
    </Card>
  );
}

export { WelcomeSummaryCard };
