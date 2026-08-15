import { Cpu } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MockedBadge } from "@/features/admin/components/mocked-badge";
import { ServiceStatusBadge } from "@/features/admin/components/service-status-badge";
import type { AiServiceHealth } from "@/types/admin";

export interface AiHealthSummaryCardProps {
  health: AiServiceHealth;
}

function AiHealthSummaryCard({ health }: AiHealthSummaryCardProps) {
  return (
    <Card variant="elevated">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-base">AI service</CardTitle>
          </div>
          <CardDescription>Active model: {health.activeModel}</CardDescription>
        </div>
        <ServiceStatusBadge status={health.status} />
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <MockedBadge />
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/ai-services">Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export { AiHealthSummaryCard };
