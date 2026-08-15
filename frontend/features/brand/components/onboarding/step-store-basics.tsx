"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm } from "react-hook-form";

import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateStore } from "@/features/brand/hooks/use-create-store";
import { useStore } from "@/features/brand/hooks/use-store";
import { slugify, type StoreBasicsFormValues, storeBasicsSchema } from "@/features/brand/schemas";

export interface StepStoreBasicsProps {
  onContinue: () => void;
}

/**
 * Only step that persists to a real backend call — `POST /store` accepts
 * exactly `{name, slug}` (see api/brand/store.ts). If a store already
 * exists (e.g. the brand admin resumed onboarding after finishing this
 * step previously), skip straight to `onContinue` instead of trying to
 * create a second one — `Store.owner_user_id` is unique server-side.
 */
function StepStoreBasics({ onContinue }: StepStoreBasicsProps) {
  const { data: existingStore } = useStore();
  const createStoreMutation = useCreateStore();
  const slugTouchedRef = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StoreBasicsFormValues>({
    resolver: zodResolver(storeBasicsSchema),
    defaultValues: { name: existingStore?.name ?? "", slug: existingStore?.slug ?? "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (existingStore) {
      onContinue();
      return;
    }
    await createStoreMutation.mutateAsync(values);
    onContinue();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Set up your store</h2>
        <p className="text-sm text-muted-foreground">
          Your store name and URL slug — shoppers will see these on your storefront.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Store name</Label>
        <Input
          id="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...register("name", {
            onChange: (event) => {
              if (!slugTouchedRef.current) {
                setValue("slug", slugify(event.target.value));
              }
            },
          })}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Store URL slug</Label>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">fitmirror.ai/store/</span>
          <Input
            id="slug"
            aria-invalid={!!errors.slug}
            aria-describedby={errors.slug ? "slug-error" : undefined}
            {...register("slug", {
              onChange: () => {
                slugTouchedRef.current = true;
              },
            })}
          />
        </div>
        {errors.slug && (
          <p id="slug-error" className="text-sm text-destructive">
            {errors.slug.message}
          </p>
        )}
      </div>

      {createStoreMutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {createStoreMutation.error instanceof ApiError
            ? createStoreMutation.error.message
            : "Something went wrong. Please try again."}
        </p>
      )}

      <Button type="submit" isLoading={createStoreMutation.isPending} className="w-fit">
        Continue
      </Button>
    </form>
  );
}

export { StepStoreBasics };
