"use client";

import Link from "next/link";
import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RequireStore } from "@/features/brand/components/require-store";
import { useStoreAnalytics } from "@/features/brand/hooks/use-store-analytics";
import type { StoreAnalytics } from "@/types/brand";

const RANGES = [7, 30, 90] as const;

const FIT_LABELS = [
  ["small", "Runs small"],
  ["true_to_size", "True to size"],
  ["large", "Runs large"],
] as const;

function percent(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—";
}

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-3xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function AnalyticsReport({ data }: { data: StoreAnalytics }) {
  const fitReports = Object.values(data.fit_counts).reduce((sum, count) => sum + count, 0);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Try-ons"
          value={data.tryons.toLocaleString()}
          hint="On your catalog in this period"
        />
        <StatTile
          label="Shoppers"
          value={data.shoppers.toLocaleString()}
          hint="Different shoppers who tried something on"
        />
        <StatTile
          label="Completed"
          value={percent(data.completed, data.tryons)}
          hint={`${data.completed.toLocaleString()} try-ons finished`}
        />
        <StatTile
          label="Saved"
          value={percent(data.saved_looks, data.completed)}
          hint={`${data.saved_looks.toLocaleString()} saved by shoppers`}
        />
      </div>

      {data.tryons === 0 ? (
        <EmptyState
          title="No try-ons in this period"
          description="Once shoppers try on your products, you'll see which ones and in what sizes."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Most tried products</CardTitle>
              <CardDescription>Your top {data.top_products.length} by try-ons.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Try-ons</TableHead>
                    <TableHead className="text-right">Shoppers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.top_products.map((product) => (
                    <TableRow key={product.product_id}>
                      <TableCell>
                        <Link
                          href={`/brand/products/${product.product_id}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {product.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{product.tryons}</TableCell>
                      <TableCell className="text-right tabular-nums">{product.shoppers}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Size demand</CardTitle>
              <CardDescription>Which sizes shoppers try on most.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Try-ons</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.size_demand.map((size) => (
                    <TableRow key={size.size_label}>
                      <TableCell>{size.size_label}</TableCell>
                      <TableCell className="text-right tabular-nums">{size.tryons}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {percent(size.tryons, data.tryons)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How your catalog fits</CardTitle>
          <CardDescription>
            All fit reports from shoppers who own your products, not just this period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fitReports === 0 ? (
            <p className="text-sm text-muted-foreground">No fit reports yet.</p>
          ) : (
            <dl className="grid grid-cols-3 gap-4">
              {FIT_LABELS.map(([verdict, label]) => (
                <div key={verdict}>
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="font-display text-2xl font-semibold tabular-nums">
                    {percent(data.fit_counts[verdict], fitReports)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Shoppers are counted, never identified. Try-ons are kept for 90 days, so this report can’t
        go back further. Purchases and product views aren’t tracked yet.
      </p>
    </>
  );
}

function AnalyticsContent() {
  const [days, setDays] = useState<number>(30);
  const analytics = useStoreAnalytics(days);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Try-on performance and shopper demand for your catalog.
          </p>
        </div>
        <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
          <SelectTrigger className="w-40" aria-label="Date range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((range) => (
              <SelectItem key={range} value={String(range)}>
                Last {range} days
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {analytics.isError ? (
        <ErrorState
          title="Couldn't load analytics"
          description="Please try again."
          onRetry={() => analytics.refetch()}
        />
      ) : analytics.data ? (
        <AnalyticsReport data={analytics.data} />
      ) : (
        <Skeleton className="h-64 w-full" />
      )}
    </div>
  );
}

/** Backed by `GET /store/analytics`; totals only, see docs/frontend/BRAND_APP.md. */
function AnalyticsView() {
  return <RequireStore>{() => <AnalyticsContent />}</RequireStore>;
}

export { AnalyticsView };
