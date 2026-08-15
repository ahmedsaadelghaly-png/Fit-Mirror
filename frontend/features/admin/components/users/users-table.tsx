"use client";

import { MoreHorizontal, Shield } from "lucide-react";
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
import { RoleChangeDialog } from "@/features/admin/components/users/role-change-dialog";
import { UserRoleBadge } from "@/features/admin/components/users/user-role-badge";
import { useToggleUserActive } from "@/features/admin/hooks/use-toggle-user-active";
import type { ResolvedAdminUser } from "@/features/admin/lib/resolve-user";

export interface UsersTableProps {
  users: ResolvedAdminUser[];
}

/** Activate/deactivate and role change are both local-overlay placeholders — see api/admin/users.ts. */
function UsersTable({ users }: UsersTableProps) {
  const toggleActiveMutation = useToggleUserActive();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last login</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <Link href={`/admin/users/${user.id}`} className="flex flex-col hover:underline">
                <span className="font-medium">{user.full_name ?? user.email}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </Link>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                <UserRoleBadge role={user.role} />
                {user.hasLocalEdits && (
                  <Shield
                    className="size-3.5 text-muted-foreground"
                    aria-label="Has unsynced local edits"
                  />
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={user.is_active ? "success" : "secondary"}>
                {user.is_active ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Never"}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Actions for ${user.email}`}>
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/users/${user.id}`}>View details</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      toggleActiveMutation.mutate({ userId: user.id, isActive: !user.is_active })
                    }
                  >
                    {user.is_active ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                  <RoleChangeDialog
                    userId={user.id}
                    currentRole={user.role}
                    trigger={
                      <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                        Change role
                      </DropdownMenuItem>
                    }
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export { UsersTable };
