"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Palette, Ruler, UsersRound } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploadField } from "@/shared/components/image-upload-field";
import { ResolvedImage } from "@/shared/components/resolved-image";
import { useUpload } from "@/features/shopper/hooks/use-upload";
import { useUpsertBodyProfile } from "@/features/shopper/hooks/use-upsert-body-profile";
import { findBodyCategory } from "@/features/shopper/body-shapes";
import { BodyShapePicker } from "@/features/shopper/components/body-shape/body-shape-picker";
import {
  type BodyProfileFormValues,
  bodyProfileFormSchema,
  COLOR_PALETTE,
  PREFERRED_FITS,
  STYLE_TAGS,
  withBodyShapeRule,
} from "@/features/shopper/schemas";
import type { BodyCategory, BodyProfile } from "@/types/domain";

const MEASUREMENT_FIELDS = [
  { name: "height_cm", label: "Height (cm)" },
  { name: "weight_kg", label: "Weight (kg)" },
  { name: "chest_cm", label: "Chest (cm)" },
  { name: "waist_cm", label: "Waist (cm)" },
  { name: "hip_cm", label: "Hips (cm)" },
] as const;

function formatOptionLabel(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export interface BodyProfileFormProps {
  /**
   * Passed down from BodyProfileView's own `useBodyProfile()` call rather
   * than calling the hook again here — a second independent observer on
   * the same query, mounting only once the first one resolves to a 404
   * ("missing" state), used to trigger TanStack Query's refetch-on-mount
   * for the still-errored query — which set bodyProfileQuery.isLoading
   * back to true, unmounting this form, which then remounted once the
   * refetch settled, subscribing a "new" observer again: an infinite
   * loading/error loop. Caught by tests/e2e/shopper-smoke.spec.ts's body
   * profile test, which never saw the form settle.
   */
  existingProfile: BodyProfile | undefined;
}

/**
 * Full Body Profile form — measurements, body shape, style preferences
 * and the reference photo (uploaded to storage first via
 * features/shopper/hooks/use-upload.ts) all save with one
 * `PUT /users/me/body-profile`.
 */
function BodyProfileForm({ existingProfile }: BodyProfileFormProps) {
  const upsertMutation = useUpsertBodyProfile();
  const upload = useUpload();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BodyProfileFormValues>({
    resolver: zodResolver(withBodyShapeRule(bodyProfileFormSchema)),
    defaultValues: {
      favorite_colors: [],
      style_preferences: [],
    },
  });

  useEffect(() => {
    if (!existingProfile) return;
    reset({
      height_cm: existingProfile.height_cm ?? undefined,
      weight_kg: existingProfile.weight_kg ?? undefined,
      chest_cm: existingProfile.chest_cm ?? undefined,
      waist_cm: existingProfile.waist_cm ?? undefined,
      hip_cm: existingProfile.hip_cm ?? undefined,
      body_category: existingProfile.body_category ?? "",
      body_shape: existingProfile.body_shape ?? "",
      preferred_fit:
        (existingProfile.preferred_fit as BodyProfileFormValues["preferred_fit"]) ?? "",
      favorite_colors: existingProfile.favorite_colors as BodyProfileFormValues["favorite_colors"],
      style_preferences:
        existingProfile.style_preferences as BodyProfileFormValues["style_preferences"],
    });
  }, [existingProfile, reset]);

  const bodyCategory = watch("body_category") || "";
  const isKids = findBodyCategory(bodyCategory)?.isKids ?? false;
  const favoriteColors = watch("favorite_colors") ?? [];
  const styleTags = watch("style_preferences") ?? [];

  const toggleInArray = <T,>(current: T[], value: T): T[] =>
    current.includes(value) ? current.filter((item) => item !== value) : [...current, value];

  const onSubmit = handleSubmit(async (values) => {
    await upsertMutation.mutateAsync({
      height_cm: values.height_cm ?? null,
      weight_kg: values.weight_kg ?? null,
      chest_cm: values.chest_cm ?? null,
      waist_cm: values.waist_cm ?? null,
      hip_cm: values.hip_cm ?? null,
      body_category: (values.body_category || null) as BodyCategory | null,
      body_shape: values.body_shape || null,
      preferred_fit: values.preferred_fit || null,
      favorite_colors: values.favorite_colors,
      style_preferences: values.style_preferences,
      ...(upload.objectKey ? { reference_image_key: upload.objectKey } : {}),
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      <Card variant="flush">
        <CardHeader className="flex-row items-center gap-3 px-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent">
            <UsersRound className="size-4 text-accent-foreground" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Body type</h2>
            <p className="text-sm text-muted-foreground">
              Sets which sizes and fit advice apply — women&apos;s, men&apos;s, or kids&apos; (sized
              by height).
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <BodyShapePicker
            idPrefix="profile"
            value={{ category: bodyCategory, shape: watch("body_shape") || "" }}
            onChange={({ category, shape }) => {
              setValue("body_category", category, { shouldDirty: true });
              setValue("body_shape", shape, { shouldDirty: true, shouldValidate: !!shape });
            }}
            error={errors.body_shape?.message}
          />
        </CardContent>
      </Card>

      <Card variant="flush">
        <CardHeader className="flex-row items-center gap-3 px-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent">
            <Ruler className="size-4 text-accent-foreground" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Measurements</h2>
            <p className="text-sm text-muted-foreground">
              {isKids
                ? "For kids, height is what matters most — the rest is optional."
                : "Used to fit try-on results and size recommendations to you."}
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 px-0 sm:grid-cols-2 lg:grid-cols-3">
          {MEASUREMENT_FIELDS.map(({ name, label }) => (
            <div key={name} className="flex flex-col gap-1.5">
              <Label htmlFor={name}>{label}</Label>
              <Input
                id={name}
                type="number"
                inputMode="decimal"
                step="0.1"
                aria-invalid={!!errors[name]}
                aria-describedby={errors[name] ? `${name}-error` : undefined}
                {...register(name)}
              />
              {errors[name] && (
                <p id={`${name}-error`} className="text-sm text-destructive">
                  {errors[name]?.message}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card variant="flush">
        <CardHeader className="flex-row items-center gap-3 px-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent">
            <Palette className="size-4 text-accent-foreground" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Style preferences</h2>
            <p className="text-sm text-muted-foreground">
              Saved on this device for now — see docs/frontend/SHOPPER_APP.md for why these
              aren&apos;t sent to the server yet.
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="preferred_fit">Preferred fit</Label>
            <Select
              value={watch("preferred_fit") || undefined}
              onValueChange={(value) =>
                setValue("preferred_fit", value as BodyProfileFormValues["preferred_fit"])
              }
            >
              <SelectTrigger id="preferred_fit" className="max-w-64">
                <SelectValue placeholder="Select a preferred fit" />
              </SelectTrigger>
              <SelectContent>
                {PREFERRED_FITS.map((fit) => (
                  <SelectItem key={fit} value={fit}>
                    {formatOptionLabel(fit)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Favorite colors</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {COLOR_PALETTE.map((color) => (
                <label key={color} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={favoriteColors.includes(color)}
                    onCheckedChange={() =>
                      setValue("favorite_colors", toggleInArray(favoriteColors, color))
                    }
                  />
                  {formatOptionLabel(color)}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Style</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {STYLE_TAGS.map((tag) => (
                <label key={tag} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={styleTags.includes(tag)}
                    onCheckedChange={() =>
                      setValue("style_preferences", toggleInArray(styleTags, tag))
                    }
                  />
                  {formatOptionLabel(tag)}
                </label>
              ))}
            </div>
          </fieldset>
        </CardContent>
      </Card>

      <Card variant="flush">
        <CardHeader className="flex-row items-center gap-3 px-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent">
            <Camera className="size-4 text-accent-foreground" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Reference photo</h2>
            <p className="text-sm text-muted-foreground">
              A well-lit, front-facing photo helps try-on results line up correctly.
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0 sm:flex-row sm:items-start">
          {existingProfile?.reference_image_key && !upload.previewUrl && (
            <figure className="flex w-32 shrink-0 flex-col gap-1">
              <ResolvedImage
                imageKey={existingProfile.reference_image_key}
                alt="Your saved reference photo"
                className="aspect-[3/4] w-32 rounded-lg object-cover"
              />
              <figcaption className="text-xs text-muted-foreground">Saved photo</figcaption>
            </figure>
          )}
          <div className="flex-1">
            <ImageUploadField
              label="Drop a reference photo here, or click to browse"
              hint="PNG or JPG, up to 10MB"
              status={upload.status}
              previewUrl={upload.previewUrl}
              progress={upload.progress}
              error={upload.error}
              onFileSelected={(file) => upload.upload(file).catch(() => undefined)}
              onClear={upload.reset}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Saved with your profile and used as your photo for catalog try-ons.
            </p>
          </div>
        </CardContent>
      </Card>

      {upsertMutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {upsertMutation.error instanceof ApiError
            ? upsertMutation.error.message
            : "Something went wrong. Please try again."}
        </p>
      )}

      {upsertMutation.isSuccess && !upsertMutation.isPending && (
        <p role="status" className="text-sm text-success">
          Your body profile has been saved.
        </p>
      )}

      <Button type="submit" isLoading={upsertMutation.isPending} className="w-fit">
        Save body profile
      </Button>
    </form>
  );
}

export { BodyProfileForm };
