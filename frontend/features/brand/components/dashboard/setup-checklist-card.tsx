import { Circle, CircleCheck } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SetupChecklistItem } from "@/features/brand/lib/dashboard-summary-adapter";

export interface SetupChecklistCardProps {
  items: SetupChecklistItem[];
}

function SetupChecklistCard({ items }: SetupChecklistCardProps) {
  const remaining = items.filter((item) => !item.isComplete).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Setup checklist</CardTitle>
        <CardDescription>
          {remaining === 0
            ? "You're all set up."
            : `${remaining} step${remaining === 1 ? "" : "s"} left`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center gap-2 rounded-md p-1.5 text-sm transition-colors hover:bg-accent/50"
          >
            {item.isComplete ? (
              <CircleCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
            ) : (
              <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <span className={item.isComplete ? "text-muted-foreground line-through" : undefined}>
              {item.label}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export { SetupChecklistCard };
