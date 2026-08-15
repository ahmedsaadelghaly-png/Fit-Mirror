import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

function StepCompletion() {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="size-7 text-success" aria-hidden="true" />
      </div>
      <div>
        <h2 className="font-display text-xl font-semibold">Your store is ready</h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Add your first product to start showing up in shopper try-ons.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/brand">Go to dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/brand/products/new">Add a product</Link>
        </Button>
      </div>
    </div>
  );
}

export { StepCompletion };
