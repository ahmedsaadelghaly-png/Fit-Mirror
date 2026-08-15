"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSuspendStore } from "@/features/admin/hooks/use-suspend-store";
import { useVerifyStore } from "@/features/admin/hooks/use-verify-store";
import type { ResolvedAdminStore } from "@/features/admin/lib/resolve-store";
import { useConfirm } from "@/shared/components/confirm-dialog-provider";

export interface StoresTableProps {
  stores: ResolvedAdminStore[];
}

/** Verify and suspend are both local-overlay placeholders — see api/admin/stores.ts. Suspend goes through `useConfirm()` (docs/frontend/UX_SYSTEM.md) since it's the more consequential of the two actions. */
function StoresTable({ stores }: StoresTableProps) {
  const verifyMutation = useVerifyStore();
  const suspendMutation = useSuspendStore();
  const confirm = useConfirm();

  const handleSuspendToggle = async (store: ResolvedAdminStore) => {
    if (!store.is_suspended) {
      const confirmed = await confirm({
        title: `Suspend ${store.name}?`,
        description:
          "Shoppers won't be able to try on products from this store while it's suspended.",
        confirmLabel: "Suspend",
        destructive: true,
      });
      if (!confirmed) return;
    }
    suspendMutation.mutate({ storeId: store.id, isSuspended: !store.is_suspended });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Store</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Products</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {stores.map((store) => (
          <TableRow key={store.id}>
            <TableCell>
              <Link href={`/admin/stores/${store.id}`} className="flex flex-col hover:underline">
                <span className="font-medium">{store.name}</span>
                <span className="text-xs text-muted-foreground">{store.slug}</span>
              </Link>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{store.owner_email}</TableCell>
            <TableCell>{store.product_count}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                <Badge variant={store.is_verified ? "success" : "secondary"}>
                  {store.is_verified ? "Verified" : "Unverified"}
                </Badge>
                {store.is_suspended && <Badge variant="destructive">Suspended</Badge>}
              </div>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Actions for ${store.name}`}>
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/stores/${store.id}`}>View details</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      verifyMutation.mutate({ storeId: store.id, isVerified: !store.is_verified })
                    }
                  >
                    {store.is_verified ? "Revoke verification" : "Verify store"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSuspendToggle(store)}>
                    {store.is_suspended ? "Unsuspend" : "Suspend"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export { StoresTable };
