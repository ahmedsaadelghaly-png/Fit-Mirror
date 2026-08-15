import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface StatSummaryCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  value: number | string;
  href: string;
  linkLabel: string;
}

/** Generic platform-metric tile shared by the four Admin dashboard summary cards (users/stores/products/try-on jobs). */
function StatSummaryCard({
  icon: Icon,
  title,
  description,
  value,
  href,
  linkLabel,
}: StatSummaryCardProps) {
  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <span className="font-display text-3xl font-semibold">{value}</span>
        <Button asChild variant="outline" size="sm">
          <Link href={href}>{linkLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export { StatSummaryCard };
