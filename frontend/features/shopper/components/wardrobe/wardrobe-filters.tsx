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
import { WARDROBE_CATEGORIES } from "@/features/shopper/schemas";
import type { WardrobeFilters as WardrobeFiltersValue } from "@/types/shopper";

export interface WardrobeFiltersProps {
  filters: WardrobeFiltersValue;
  onChange: (filters: WardrobeFiltersValue) => void;
}

/**
 * `GET /wardrobe` has no filter query params (see api/shopper/wardrobe.ts)
 * — these controls filter the already-fetched list client-side. There is
 * also no `color` field on `WardrobeItemRead`, so "color" from the Phase
 * 2.3 spec is intentionally not offered here — see
 * docs/frontend/SHOPPER_APP.md "API contract mismatches".
 */
function WardrobeFiltersBar({ filters, onChange }: WardrobeFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wardrobe-search">Search</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="wardrobe-search"
            placeholder="Search by category or label"
            className="w-64 pl-9"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wardrobe-category">Category</Label>
        <Select
          value={filters.category}
          onValueChange={(value) =>
            onChange({ ...filters, category: value as WardrobeFiltersValue["category"] })
          }
        >
          <SelectTrigger id="wardrobe-category" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {WARDROBE_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category} className="capitalize">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wardrobe-source">Source</Label>
        <Select
          value={filters.source}
          onValueChange={(value) =>
            onChange({ ...filters, source: value as WardrobeFiltersValue["source"] })
          }
        >
          <SelectTrigger id="wardrobe-source" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="uploaded">Uploaded</SelectItem>
            <SelectItem value="catalog">Catalog</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export { WardrobeFiltersBar };
