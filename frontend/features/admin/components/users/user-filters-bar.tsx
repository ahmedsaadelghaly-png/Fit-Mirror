"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminUserFilters } from "@/types/admin";

export interface UserFiltersBarProps {
  filters: AdminUserFilters;
  onChange: (filters: AdminUserFilters) => void;
}

function UserFiltersBar({ filters, onChange }: UserFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="user-search">Search</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="user-search"
            placeholder="Search by name or email"
            className="w-64 pl-9"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="user-role">Role</Label>
        <Select
          value={filters.role}
          onValueChange={(value) =>
            onChange({ ...filters, role: value as AdminUserFilters["role"] })
          }
        >
          <SelectTrigger id="user-role" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="shopper">Shopper</SelectItem>
            <SelectItem value="brand_admin">Brand admin</SelectItem>
            <SelectItem value="platform_admin">Platform admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="user-status">Status</Label>
        <Select
          value={filters.status}
          onValueChange={(value) =>
            onChange({ ...filters, status: value as AdminUserFilters["status"] })
          }
        >
          <SelectTrigger id="user-status" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export { UserFiltersBar };
