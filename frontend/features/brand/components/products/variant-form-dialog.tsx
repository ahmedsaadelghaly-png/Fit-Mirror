"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddVariant } from "@/features/brand/hooks/use-add-variant";
import { useUpdateVariant } from "@/features/brand/hooks/use-update-variant";
import { type VariantFormValues, variantSchema } from "@/features/brand/schemas";
import { useUpload } from "@/features/shopper/hooks/use-upload";
import { ImageUploadField } from "@/shared/components/image-upload-field";
import type { ProductVariant } from "@/types/domain";

export interface VariantFormDialogProps {
  productId: string;
  /** Edit mode when a variant is passed; add mode otherwise. */
  variant?: ProductVariant;
  trigger?: React.ReactNode;
}

/**
 * No backend endpoint exists to create/edit a variant at all (see
 * api/brand/product-overlay.ts) — both add and "edit variant placeholder"
 * from the Phase 2.4 spec write to the same localStorage overlay.
 */
function VariantFormDialog({ productId, variant, trigger }: VariantFormDialogProps) {
  const [open, setOpen] = useState(false);
  const isEditMode = !!variant;
  const addMutation = useAddVariant(productId);
  const updateMutation = useUpdateVariant(productId);
  const upload = useUpload();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      size_label: variant?.size_label ?? "",
      color: variant?.color ?? "",
      sku: variant?.sku ?? "",
      stock_quantity: variant?.stock_quantity ?? 0,
    },
  });

  const mutation = isEditMode ? updateMutation : addMutation;

  const closeAndReset = () => {
    setOpen(false);
    reset();
    upload.reset();
  };

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      size_label: values.size_label,
      color: values.color || null,
      sku: values.sku,
      stock_quantity: values.stock_quantity,
      garment_image_key: upload.objectKey ?? variant?.garment_image_key ?? null,
    };

    if (isEditMode && variant) {
      await updateMutation.mutateAsync({ variantId: variant.id, variant: payload });
    } else {
      await addMutation.mutateAsync(payload);
    }
    closeAndReset();
  });

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : closeAndReset())}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm">
            <Plus className="size-3.5" /> Add variant
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit variant" : "Add a variant"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="size_label">Size</Label>
              <Input id="size_label" {...register("size_label")} />
              {errors.size_label && (
                <p className="text-sm text-destructive">{errors.size_label.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="color">Color</Label>
              <Input id="color" {...register("color")} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" {...register("sku")} />
            {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock_quantity">Stock quantity</Label>
            <Input
              id="stock_quantity"
              type="number"
              inputMode="numeric"
              {...register("stock_quantity")}
            />
            {errors.stock_quantity && (
              <p className="text-sm text-destructive">{errors.stock_quantity.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Garment image</Label>
            <ImageUploadField
              label="Drop a garment photo here, or click to browse"
              hint="PNG or JPG, up to 10MB"
              status={upload.status}
              previewUrl={upload.previewUrl}
              progress={upload.progress}
              error={upload.error}
              onFileSelected={(file) => upload.upload(file).catch(() => undefined)}
              onClear={upload.reset}
            />
          </div>

          <DialogFooter>
            <Button type="submit" isLoading={mutation.isPending}>
              {isEditMode ? "Save changes" : "Add variant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { VariantFormDialog };
