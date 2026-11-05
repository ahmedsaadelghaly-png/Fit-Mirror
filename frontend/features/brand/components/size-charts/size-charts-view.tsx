"use client";

import { Ruler, Trash2, Upload } from "lucide-react";
import { useState } from "react";

import { ApiError } from "@/api/client";
import { SIZED_CATEGORIES } from "@/api/brand/size-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { RequireStore } from "@/features/brand/components/require-store";
import {
  useDeleteSizeChart,
  useSaveSizeChart,
  useSizeCharts,
} from "@/features/brand/hooks/use-size-charts";
import { useConfirm } from "@/shared/components/confirm-dialog-provider";
import type { SizeChart, SizeChartRow } from "@/types/brand";

const MEASUREMENTS = [
  ["chest_cm", "Chest"],
  ["waist_cm", "Waist"],
  ["hip_cm", "Hip"],
  ["height_cm", "Height"],
] as const;

const EXAMPLE_CSV = "size,chest,waist\nS,86-94,70-78\nM,94-102,78-86\nL,102-110,86-94\n";

function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function toCsv(chart: SizeChart): string {
  const columns = MEASUREMENTS.filter(([key]) => chart.rows.some((row) => row[key]));
  const header = ["size", ...columns.map(([, label]) => label.toLowerCase())].join(",");
  const lines = chart.rows.map((row) =>
    [row.size_label, ...columns.map(([key]) => (row[key] ? row[key]!.join("-") : ""))].join(","),
  );
  return [header, ...lines].join("\n") + "\n";
}

function SizeChartsView() {
  return <RequireStore>{() => <SizeChartsContent />}</RequireStore>;
}

/**
 * The brand's own measurements per size, one chart per garment category.
 * Size recommendations for the store's products use these instead of the
 * standard chart whenever the size labels match (backend sizing_service).
 */
function SizeChartsContent() {
  const { data: charts, isLoading, isError, refetch } = useSizeCharts();
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Size charts</h1>
        <p className="text-sm text-muted-foreground">
          Your own measurements per size. Shoppers&apos; size recommendations use them instead of
          the standard chart.
        </p>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}
      {!isLoading && isError && (
        <ErrorState
          description="We couldn't load your size charts. Please try again."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (
        <div className="grid gap-4 lg:grid-cols-2">
          {SIZED_CATEGORIES.map((category) => (
            <SizeChartCard
              key={category}
              category={category}
              chart={charts?.find((chart) => chart.category === category)}
              onEdit={() => setEditing(category)}
            />
          ))}
        </div>
      )}

      <SizeChartDialog
        category={editing}
        chart={charts?.find((chart) => chart.category === editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </div>
  );
}

function SizeChartCard({
  category,
  chart,
  onEdit,
}: {
  category: string;
  chart: SizeChart | undefined;
  onEdit: () => void;
}) {
  const deleteMutation = useDeleteSizeChart();
  const confirm = useConfirm();
  const columns = MEASUREMENTS.filter(([key]) => chart?.rows.some((row) => row[key]));

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Remove the ${category} size chart?`,
      description: "Recommendations for these products go back to the standard chart.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (confirmed) deleteMutation.mutate(category);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">{formatCategory(category)}</CardTitle>
          <CardDescription>
            {chart
              ? `${chart.rows.length} sizes · updated ${new Date(chart.updated_at).toLocaleDateString()}`
              : "Using the standard chart"}
          </CardDescription>
        </div>
        {chart ? <Badge>Your chart</Badge> : <Badge variant="secondary">Standard</Badge>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {chart && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Size</TableHead>
                {columns.map(([key, label]) => (
                  <TableHead key={key}>{label} (cm)</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {chart.rows.map((row: SizeChartRow) => (
                <TableRow key={row.size_label}>
                  <TableCell className="font-medium">{row.size_label}</TableCell>
                  {columns.map(([key]) => (
                    <TableCell key={key}>{row[key] ? row[key]!.join("–") : "—"}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Ruler className="size-3.5" /> {chart ? "Edit chart" : "Add chart"}
          </Button>
          {chart && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              <Trash2 className="size-3.5" /> Remove
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SizeChartDialog({
  category,
  chart,
  onOpenChange,
}: {
  category: string | null;
  chart: SizeChart | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!category} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {category && (
          <SizeChartEditor
            key={category}
            category={category}
            initialCsv={chart ? toCsv(chart) : EXAMPLE_CSV}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SizeChartEditor({
  category,
  initialCsv,
  onSaved,
}: {
  category: string;
  initialCsv: string;
  onSaved: () => void;
}) {
  const [csv, setCsv] = useState(initialCsv);
  const saveMutation = useSaveSizeChart();

  const handleFile = async (file: File | undefined) => {
    if (file) setCsv(await file.text());
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        saveMutation.mutate({ category, csv }, { onSuccess: onSaved });
      }}
    >
      <DialogHeader>
        <DialogTitle>{formatCategory(category)} size chart</DialogTitle>
        <DialogDescription>
          One row per size, smallest first. Columns: size, then any of chest, waist, hip and height
          — each a range in cm, like 86-94.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="size-chart-csv">Chart (CSV)</Label>
        <Textarea
          id="size-chart-csv"
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          rows={9}
          className="font-mono text-sm"
          spellCheck={false}
        />
      </div>
      <Label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-normal text-primary-text hover:underline">
        <Upload className="size-3.5" aria-hidden="true" /> Upload a .csv file
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </Label>
      {saveMutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {saveMutation.error instanceof ApiError
            ? saveMutation.error.message
            : "Couldn't save this chart. Please try again."}
        </p>
      )}
      <DialogFooter>
        <Button type="submit" isLoading={saveMutation.isPending} disabled={!csv.trim()}>
          Save chart
        </Button>
      </DialogFooter>
    </form>
  );
}

export { SizeChartsView, toCsv };
