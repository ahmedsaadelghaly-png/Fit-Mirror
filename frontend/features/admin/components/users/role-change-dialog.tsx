"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChangeUserRole } from "@/features/admin/hooks/use-change-user-role";
import type { UserRole } from "@/types/domain";

export interface RoleChangeDialogProps {
  userId: string;
  currentRole: UserRole;
  trigger: ReactNode;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "shopper", label: "Shopper" },
  { value: "brand_admin", label: "Brand admin" },
  { value: "platform_admin", label: "Platform admin" },
];

/** PLACEHOLDER — no `/admin/users/{id}` endpoint exists to persist a role change; see api/admin/users.ts's localStorage overlay. */
function RoleChangeDialog({ userId, currentRole, trigger }: RoleChangeDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const changeRoleMutation = useChangeUserRole();

  const onConfirm = () => {
    changeRoleMutation.mutate({ userId, role: selectedRole }, { onSuccess: () => setOpen(false) });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
        </DialogHeader>
        <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
          <SelectTrigger aria-label="New role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button type="button" onClick={onConfirm} isLoading={changeRoleMutation.isPending}>
            Save role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { RoleChangeDialog };
