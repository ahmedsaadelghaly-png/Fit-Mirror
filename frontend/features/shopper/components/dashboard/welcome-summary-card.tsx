import { CircleCheck, Shirt, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FashionImage } from "@/shared/components/fashion-image";
import type { User } from "@/types/domain";

export interface WelcomeSummaryCardProps {
  user: User;
  isOnboardingComplete: boolean;
}

/** Photographic greeting banner — the dashboard's single h1 and primary actions. */
function WelcomeSummaryCard({ user, isOnboardingComplete }: WelcomeSummaryCardProps) {
  const firstName = (user.full_name ?? user.email).split(/[\s@]/)[0];

  return (
    <section className="relative overflow-hidden rounded-2xl bg-foreground text-white">
      <FashionImage
        src="/images/editorial/rail-neutral.jpg"
        alt=""
        aspect="wide"
        className="absolute inset-0 aspect-auto h-full w-full"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/10" />
      <div className="relative flex flex-col gap-5 p-6 md:p-10">
        <div className="max-w-xl space-y-2">
          <p className="text-sm text-white/70">Your fitting room</p>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">
            Welcome back, {firstName}
          </h1>
          <p className="text-white/80">
            {isOnboardingComplete
              ? "Pick a garment and see it on you — or let the stylist put a look together."
              : "Add your body profile and style preferences so try-ons and sizes fit you better."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isOnboardingComplete ? (
            <>
              <Button asChild>
                <Link href="/shopper/tryon">
                  <Sparkles className="size-4" aria-hidden="true" /> Start a try-on
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/shopper/wardrobe">
                  <Shirt className="size-4" aria-hidden="true" /> Open wardrobe
                </Link>
              </Button>
              <span className="inline-flex items-center gap-1.5 text-sm text-white/80">
                <CircleCheck className="size-4 text-success" aria-hidden="true" /> Profile set up
              </span>
            </>
          ) : (
            <>
              <Button asChild>
                <Link href="/shopper/onboarding">Finish setup</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/shopper/tryon">
                  <Sparkles className="size-4" aria-hidden="true" /> Try something on
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export { WelcomeSummaryCard };
