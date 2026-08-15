"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStoreBusinessInfo } from "@/features/brand/hooks/use-store-business-info";
import {
  BRAND_CATEGORIES,
  type StoreBusinessInfoFormValues,
  storeBusinessInfoSchema,
} from "@/features/brand/schemas";

export interface StepStoreDetailsProps {
  onContinue: () => void;
  onSkip: () => void;
}

function formatOptionLabel(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * KNOWN CONTRACT MISMATCH — `category` and `description` don't exist on
 * the `Store` model at all (see types/brand.ts `StoreBusinessInfo`).
 * Persisted to the localStorage overlay, same as the logo step.
 */
function StepStoreDetails({ onContinue, onSkip }: StepStoreDetailsProps) {
  const { data: businessInfo, save } = useStoreBusinessInfo();

  const { register, watch, setValue, handleSubmit } = useForm<StoreBusinessInfoFormValues>({
    resolver: zodResolver(storeBusinessInfoSchema),
    defaultValues: {
      category: (businessInfo?.category as StoreBusinessInfoFormValues["category"]) ?? "",
      description: businessInfo?.description ?? "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    save.mutate(
      {
        category: values.category || null,
        description: values.description || null,
        social_links: businessInfo?.social_links ?? {
          website: null,
          instagram: null,
          tiktok: null,
        },
        logo_image_key: businessInfo?.logo_image_key ?? null,
      },
      { onSuccess: onContinue },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Tell shoppers about your store</h2>
        <p className="text-sm text-muted-foreground">
          A category and short description help shoppers find and understand your brand.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Brand category</Label>
        <Select
          value={watch("category") || undefined}
          onValueChange={(value) =>
            setValue("category", value as StoreBusinessInfoFormValues["category"])
          }
        >
          <SelectTrigger id="category" className="max-w-64">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {BRAND_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {formatOptionLabel(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Store description</Label>
        <Textarea id="description" rows={4} {...register("description")} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" isLoading={save.isPending}>
          Continue
        </Button>
        <Button type="button" variant="ghost" onClick={onSkip} disabled={save.isPending}>
          Skip for now
        </Button>
      </div>
    </form>
  );
}

export { StepStoreDetails };
