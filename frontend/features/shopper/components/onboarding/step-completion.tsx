import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export interface StepCompletionProps {
  onFinish: () => void;
}

function StepCompletion({ onFinish }: StepCompletionProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="size-7 text-success" aria-hidden="true" />
      </div>
      <div>
        <h2 className="font-display text-xl font-semibold">You&apos;re all set</h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Your style preferences and body profile are saved. You can update them anytime from
          Settings.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild onClick={onFinish}>
          <Link href="/shopper">Go to dashboard</Link>
        </Button>
        <Button asChild variant="outline" onClick={onFinish}>
          <Link href="/shopper/tryon">Start a try-on</Link>
        </Button>
      </div>
    </div>
  );
}

export { StepCompletion };
