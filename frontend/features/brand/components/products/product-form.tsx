"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { ApiError } from "@/api/client";
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
import { useCreateProduct } from "@/features/brand/hooks/use-create-product";
import { useSaveProductOverrides } from "@/features/brand/hooks/use-save-product-overrides";
import { useUpload } from "@/features/shopper/hooks/use-upload";
import {
  CURRENCIES,
  PRODUCT_CATEGORIES,
  type ProductFormValues,
  productSchema,
} from "@/features/brand/schemas";
import { toast } from "@/hooks/use-toast";
import { ImageUploadField } from "@/shared/components/image-upload-field";
import type { ResolvedProduct } from "@/types/brand";

function formatOptionLabel(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export interface ProductFormProps {
  /** Edit mode when a product is passed; create mode otherwise. */
  product?: ResolvedProduct;
}

/**
 * Shared create/edit form. Create calls the real
 * `POST /store/products` (see api/brand/products.ts). Edit has no backend
 * endpoint to call at all — `PUT/PATCH /store/products/{id}` doesn't
 * exist — so it saves to the localStorage overlay instead (see
 * api/brand/product-overlay.ts and docs/frontend/BRAND_APP.md "API
 * contract mismatches"). Variant management lives on the product details
 * page, not here — see features/brand/components/products/variant-list.tsx.
 */
function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEditMode = !!product;

  const createMutation = useCreateProduct();
  const saveOverridesMutation = useSaveProductOverrides(product?.id ?? "");
  const upload = useUpload();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: product?.title ?? "",
      description: product?.description ?? "",
      category: (product?.category as ProductFormValues["category"]) ?? undefined,
      price: product?.price ?? "",
      currency: (product?.currency as ProductFormValues["currency"]) ?? "USD",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (isEditMode && product) {
      await saveOverridesMutation.mutateAsync({
        title: values.title,
        description: values.description || null,
        category: values.category,
        price: values.price,
        currency: values.currency,
        primary_image_key: upload.objectKey ?? product.primary_image_key,
      });
      toast({ title: "Product updated", description: values.title });
      router.push(`/brand/products/${product.id}`);
      return;
    }

    const created = await createMutation.mutateAsync({
      title: values.title,
      description: values.description || null,
      category: values.category,
      price: values.price,
      currency: values.currency,
      primary_image_key: upload.objectKey ?? null,
    });
    toast({ title: "Product created", description: created.title });
    router.push(`/brand/products/${created.id}`);
  });

  const mutation = isEditMode ? saveOverridesMutation : createMutation;

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Primary image</Label>
        <ImageUploadField
          label="Drop a product photo here, or click to browse"
          hint="PNG or JPG, up to 10MB"
          status={upload.status}
          previewUrl={upload.previewUrl}
          progress={upload.progress}
          error={upload.error}
          onFileSelected={(file) => upload.upload(file).catch(() => undefined)}
          onClear={upload.reset}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
          {...register("title")}
        />
        {errors.title && (
          <p id="title-error" className="text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={4} {...register("description")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">Category</Label>
          <Select
            value={watch("category")}
            onValueChange={(value) => setValue("category", value as ProductFormValues["category"])}
          >
            <SelectTrigger id="category" aria-invalid={!!errors.category}>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {formatOptionLabel(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            inputMode="decimal"
            placeholder="49.99"
            aria-invalid={!!errors.price}
            {...register("price")}
          />
          {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={watch("currency")}
            onValueChange={(value) => setValue("currency", value as ProductFormValues["currency"])}
          >
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {mutation.error instanceof ApiError
            ? mutation.error.message
            : "Something went wrong. Please try again."}
        </p>
      )}

      <Button type="submit" isLoading={mutation.isPending} className="w-fit">
        {isEditMode ? "Save changes" : "Create product"}
      </Button>
    </form>
  );
}

export { ProductForm };
