"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ApiError } from "@/api/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateWardrobeItem } from "@/features/shopper/hooks/use-create-wardrobe-item";
import { useUpload } from "@/features/shopper/hooks/use-upload";
import {
  WARDROBE_CATEGORIES,
  type WardrobeItemFormValues,
  wardrobeItemSchema,
} from "@/features/shopper/schemas";
import { ImageUploadField } from "@/shared/components/image-upload-field";

function formatOptionLabel(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function AddWardrobeItemDialog() {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateWardrobeItem();
  const upload = useUpload();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<WardrobeItemFormValues>({
    resolver: zodResolver(wardrobeItemSchema),
    defaultValues: { source: "uploaded" },
  });

  const closeAndReset = () => {
    setOpen(false);
    reset({ source: "uploaded" });
    upload.reset();
    createMutation.reset();
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!upload.objectKey) return;
    await createMutation.mutateAsync({
      category: values.category,
      label: values.label || null,
      source: values.source,
      image_key: upload.objectKey,
    });
    closeAndReset();
  });

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : closeAndReset())}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Add item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a wardrobe item</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Category</Label>
            <Select
              value={watch("category")}
              onValueChange={(value) =>
                setValue("category", value as WardrobeItemFormValues["category"])
              }
            >
              <SelectTrigger id="category" aria-invalid={!!errors.category}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {WARDROBE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {formatOptionLabel(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="label">Label (optional)</Label>
            <Input id="label" placeholder="e.g. Blue denim jacket" {...register("label")} />
            {errors.label && <p className="text-sm text-destructive">{errors.label.message}</p>}
          </div>

          {createMutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {createMutation.error instanceof ApiError
                ? createMutation.error.message
                : "Something went wrong. Please try again."}
            </p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              disabled={!upload.objectKey || upload.status === "uploading"}
            >
              Add to wardrobe
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { AddWardrobeItemDialog };
