import { Server } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceStatusBadge } from "@/features/admin/components/service-status-badge";
import type { ServiceStatus, WorkerStatusRow } from "@/types/admin";

const WORKER_STATE_TO_SERVICE_STATUS: Record<WorkerStatusRow["state"], ServiceStatus> = {
  online: "healthy",
  degraded: "degraded",
  offline: "down",
};

export interface WorkerStatusCardProps {
  worker: WorkerStatusRow;
}

function WorkerStatusCard({ worker }: WorkerStatusCardProps) {
  return (
    <Card variant="elevated">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Server className="size-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-sm">{worker.hostname}</CardTitle>
        </div>
        <ServiceStatusBadge status={WORKER_STATE_TO_SERVICE_STATUS[worker.state]} />
      </CardHeader>
      <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {worker.activeTasks} / {worker.concurrency} tasks
        </span>
        <span className="text-xs">
          Last heartbeat {new Date(worker.lastHeartbeatAt).toLocaleTimeString()}
        </span>
      </CardContent>
    </Card>
  );
}

export { WorkerStatusCard };
