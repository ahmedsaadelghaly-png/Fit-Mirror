"use client";

import { BarChart3, Eye, Ruler, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RequireStore } from "@/features/brand/components/require-store";

const METRICS = [
  {
    id: "conversion",
    icon: Sparkles,
    title: "Try-on conversion",
    description: "How many try-ons lead to a purchase.",
  },
  {
    id: "views",
    icon: Eye,
    title: "Product views",
    description: "Views per product over time.",
  },
  {
    id: "most-tried",
    icon: BarChart3,
    title: "Most tried products",
    description: "Which products get tried on most.",
  },
  {
    id: "size-demand",
    icon: Ruler,
    title: "Size demand",
    description: "Which sizes shoppers try on most.",
  },
] as const;

/**
 * PLACEHOLDER — no analytics endpoints exist on the backend at all (no
 * per-product try-on attribution, no view tracking, no size-demand
 * aggregation). `GET /store/me/summary` only returns store-wide totals
 * (see api/brand/store.ts), not the breakdowns these cards need. See
 * docs/frontend/BRAND_APP.md "API contract mismatches".
 */
function AnalyticsView() {
  return (
    <RequireStore>
      {() => (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-semibold">Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Try-on performance and shopper demand for your catalog.
              </p>
            </div>
            <Select defaultValue="30d" disabled>
              <SelectTrigger className="w-40" aria-label="Date range (coming soon)">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {METRICS.map(({ id, icon: Icon, title, description }) => (
              <Card key={id} className="border-dashed">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                      <CardTitle className="text-base">{title}</CardTitle>
                    </div>
                    <Badge variant="secondary">Planned</Badge>
                  </div>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState title="No data yet" description="This metric isn't tracked yet." />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </RequireStore>
  );
}

export { AnalyticsView };
