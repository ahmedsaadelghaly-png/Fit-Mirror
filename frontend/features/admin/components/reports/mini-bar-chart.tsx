import type { TimeSeriesPoint } from "@/types/admin";

export interface MiniBarChartProps {
  points: TimeSeriesPoint[];
}

/**
 * A hand-rolled bar chart (plain divs, no charting library) — this
 * project has no chart dependency, and pulling one in for six data points
 * across four report cards isn't worth a new dependency.
 */
function MiniBarChart({ points }: MiniBarChartProps) {
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="flex h-24 items-end gap-2" role="img" aria-label="Trend over time">
      {points.map((point) => (
        <div key={point.label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm bg-primary/70"
            style={{ height: `${Math.max((point.value / max) * 100, 4)}%` }}
          />
          <span className="text-[10px] text-muted-foreground">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

export { MiniBarChart };
