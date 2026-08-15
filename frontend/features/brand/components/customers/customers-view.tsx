"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RequireStore } from "@/features/brand/components/require-store";

/** PLACEHOLDER — no customer/audience data model exists on the backend at all. See docs/frontend/BRAND_APP.md. */
function CustomersView() {
  return (
    <RequireStore>
      {() => (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="font-display text-2xl font-semibold">Customers</h1>
              <p className="text-sm text-muted-foreground">
                Insights about the shoppers trying on your products.
              </p>
            </div>
            <Badge variant="secondary">Planned</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Customer insights</CardTitle>
                <CardDescription>Repeat shoppers, engagement, and try-on history.</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState title="No data yet" description="This isn't tracked yet." />
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Audience</CardTitle>
                <CardDescription>Who's trying on your products, in aggregate.</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState title="No data yet" description="This isn't tracked yet." />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </RequireStore>
  );
}

export { CustomersView };
