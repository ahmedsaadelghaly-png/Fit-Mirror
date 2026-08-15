"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useUpload } from "@/features/shopper/hooks/use-upload";
import {
  BRAND_CATEGORIES,
  type StoreBusinessInfoFormValues,
  storeBusinessInfoSchema,
} from "@/features/brand/schemas";
import { ImageUploadField } from "@/shared/components/image-upload-field";
import { ResolvedImage } from "@/shared/components/resolved-image";

function formatOptionLabel(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Editable business info — everything here is frontend-only (see
 * types/brand.ts `StoreBusinessInfo`), persisted to localStorage via
 * features/brand/hooks/use-store-business-info.ts. Consolidates the three
 * onboarding steps (logo/details/social) into one form for post-onboarding
 * editing.
 */
function BusinessInfoForm() {
  const { data: businessInfo, isLoading, save } = useStoreBusinessInfo();
  const upload = useUpload();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StoreBusinessInfoFormValues>({
    resolver: zodResolver(storeBusinessInfoSchema),
  });

  useEffect(() => {
    if (!businessInfo) return;
    reset({
      category: (businessInfo.category as StoreBusinessInfoFormValues["category"]) ?? "",
      description: businessInfo.description ?? "",
      website: businessInfo.social_links.website ?? "",
      instagram: businessInfo.social_links.instagram ?? "",
      tiktok: businessInfo.social_links.tiktok ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the loaded record itself changes
  }, [businessInfo]);

  const onSubmit = handleSubmit((values) => {
    save.mutate({
      category: values.category || null,
      description: values.description || null,
      social_links: {
        website: values.website || null,
        instagram: values.instagram || null,
        tiktok: values.tiktok || null,
      },
      logo_image_key: upload.objectKey ?? businessInfo?.logo_image_key ?? null,
    });
  });

  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-lg bg-muted" role="status" aria-label="Loading" />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Store logo</Label>
        {businessInfo?.logo_image_key && !upload.previewUrl ? (
          <div className="flex items-center gap-3">
            <ResolvedImage
              imageKey={businessInfo.logo_image_key}
              alt="Store logo"
              className="size-16 rounded-lg"
            />
            <ImageUploadField
              label="Replace logo"
              hint="PNG or JPG, up to 10MB"
              status={upload.status}
              previewUrl={upload.previewUrl}
              progress={upload.progress}
              error={upload.error}
              onFileSelected={(file) => upload.upload(file).catch(() => undefined)}
              onClear={upload.reset}
              className="flex-1"
            />
          </div>
        ) : (
          <ImageUploadField
            label="Drop your logo here, or click to browse"
            hint="PNG or JPG, up to 10MB"
            status={upload.status}
            previewUrl={upload.previewUrl}
            progress={upload.progress}
            error={upload.error}
            onFileSelected={(file) => upload.upload(file).catch(() => undefined)}
            onClear={upload.reset}
          />
        )}
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="website">Website</Label>
          <Input id="website" placeholder="https://yourbrand.com" {...register("website")} />
          {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="instagram">Instagram</Label>
          <Input id="instagram" placeholder="@yourbrand" {...register("instagram")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tiktok">TikTok</Label>
          <Input id="tiktok" placeholder="@yourbrand" {...register("tiktok")} />
        </div>
      </div>

      {save.isSuccess && !save.isPending && (
        <p role="status" className="text-sm text-success">
          Saved.
        </p>
      )}

      <Button type="submit" isLoading={save.isPending} className="w-fit">
        Save changes
      </Button>
    </form>
  );
}

export { BusinessInfoForm };
