"use client";

import { ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RequireStore } from "@/features/brand/components/require-store";

/** PLACEHOLDER — no orders/checkout model exists on the backend at all. See docs/frontend/BRAND_APP.md. */
function OrdersView() {
  return (
    <RequireStore>
      {() => (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="font-display text-2xl font-semibold">Orders</h1>
              <p className="text-sm text-muted-foreground">Purchases made through your store.</p>
            </div>
            <Badge variant="secondary">Planned</Badge>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody />
            </Table>
            <EmptyState
              icon={ShoppingCart}
              title="No orders yet"
              description="Order management isn't connected to a backend yet."
              className="border-none"
            />
          </div>
        </div>
      )}
    </RequireStore>
  );
}

export { OrdersView };
