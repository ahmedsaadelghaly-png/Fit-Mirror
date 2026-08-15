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
import { PRODUCT_CATEGORIES } from "@/features/brand/schemas";
import type { ProductFilters } from "@/types/brand";

export interface ProductFiltersBarProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
}

/** `GET /store/products` accepts no query params — filtering happens client-side against the full list (see features/brand/hooks/use-products.ts). */
function ProductFiltersBar({ filters, onChange }: ProductFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-search">Search</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="product-search"
            placeholder="Search by title or category"
            className="w-64 pl-9"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-category">Category</Label>
        <Select
          value={filters.category}
          onValueChange={(value) =>
            onChange({ ...filters, category: value as ProductFilters["category"] })
          }
        >
          <SelectTrigger id="product-category" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {PRODUCT_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category} className="capitalize">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-status">Status</Label>
        <Select
          value={filters.status}
          onValueChange={(value) =>
            onChange({ ...filters, status: value as ProductFilters["status"] })
          }
        >
          <SelectTrigger id="product-status" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export { ProductFiltersBar };
