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
import type { AdminStoreFilters } from "@/types/admin";

export interface StoreFiltersBarProps {
  filters: AdminStoreFilters;
  onChange: (filters: AdminStoreFilters) => void;
}

function StoreFiltersBar({ filters, onChange }: StoreFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="store-search">Search</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="store-search"
            placeholder="Search by name or owner email"
            className="w-64 pl-9"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="store-verification">Verification</Label>
        <Select
          value={filters.verification}
          onValueChange={(value) =>
            onChange({ ...filters, verification: value as AdminStoreFilters["verification"] })
          }
        >
          <SelectTrigger id="store-verification" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stores</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export { StoreFiltersBar };
