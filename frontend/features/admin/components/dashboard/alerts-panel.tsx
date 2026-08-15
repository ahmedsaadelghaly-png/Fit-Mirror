import { AlertTriangle, Info, OctagonAlert } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MockedBadge } from "@/features/admin/components/mocked-badge";
import type { AdminAlert, AlertSeverity } from "@/types/admin";

const SEVERITY_CONFIG: Record<AlertSeverity, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "text-muted-foreground" },
  warning: { icon: AlertTriangle, className: "text-warning" },
  critical: { icon: OctagonAlert, className: "text-destructive" },
};

export interface AlertsPanelProps {
  alerts: AdminAlert[];
}

function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Alerts</CardTitle>
          <CardDescription>Things that may need attention</CardDescription>
        </div>
        <MockedBadge />
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No alerts right now.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {alerts.map((alert) => {
              const config = SEVERITY_CONFIG[alert.severity];
              const Icon = config.icon;
              return (
                <li key={alert.id} className="flex items-start gap-2 text-sm">
                  <Icon
                    className={`mt-0.5 size-4 shrink-0 ${config.className}`}
                    aria-hidden="true"
                  />
                  <span>{alert.message}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { AlertsPanel };
