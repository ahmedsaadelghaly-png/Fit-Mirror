import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MiniBarChart } from "@/features/admin/components/reports/mini-bar-chart";
import type { TimeSeriesPoint } from "@/types/admin";

export interface ReportCardProps {
  title: string;
  description: string;
  points: TimeSeriesPoint[];
}

function ReportCard({ title, description, points }: ReportCardProps) {
  const latest = points.at(-1)?.value ?? 0;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <span className="font-display text-2xl font-semibold">{latest}</span>
      </CardHeader>
      <CardContent>
        <MiniBarChart points={points} />
      </CardContent>
    </Card>
  );
}

export { ReportCard };
