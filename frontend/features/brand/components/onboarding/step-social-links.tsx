"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStoreBusinessInfo } from "@/features/brand/hooks/use-store-business-info";
import {
  type StoreBusinessInfoFormValues,
  storeBusinessInfoSchema,
} from "@/features/brand/schemas";

export interface StepSocialLinksProps {
  onContinue: () => void;
  onSkip: () => void;
}

/** Saves the store's website / Instagram / TikTok with `PATCH /store/me`. */
function StepSocialLinks({ onContinue, onSkip }: StepSocialLinksProps) {
  const { data: businessInfo, save } = useStoreBusinessInfo();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreBusinessInfoFormValues>({
    resolver: zodResolver(storeBusinessInfoSchema),
    defaultValues: {
      website: businessInfo?.social_links.website ?? "",
      instagram: businessInfo?.social_links.instagram ?? "",
      tiktok: businessInfo?.social_links.tiktok ?? "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    save.mutate(
      {
        category: businessInfo?.category ?? null,
        description: businessInfo?.description ?? null,
        social_links: {
          website: values.website || null,
          instagram: values.instagram || null,
          tiktok: values.tiktok || null,
        },
        logo_image_key: businessInfo?.logo_image_key ?? null,
      },
      { onSuccess: onContinue },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Link your social profiles</h2>
        <p className="text-sm text-muted-foreground">Optional — you can add these later too.</p>
      </div>

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

export { StepSocialLinks };
