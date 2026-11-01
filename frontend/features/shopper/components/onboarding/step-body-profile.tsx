"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpsertBodyProfile } from "@/features/shopper/hooks/use-upsert-body-profile";
import { findBodyCategory } from "@/features/shopper/body-shapes";
import { BodyShapePicker } from "@/features/shopper/components/body-shape/body-shape-picker";
import {
  type BodyMeasurementsFormValues,
  bodyMeasurementsSchema,
  withBodyShapeRule,
} from "@/features/shopper/schemas";
import type { BodyCategory } from "@/types/domain";

const MEASUREMENT_FIELDS = [
  { name: "height_cm", label: "Height (cm)" },
  { name: "weight_kg", label: "Weight (kg)" },
  { name: "chest_cm", label: "Chest (cm)" },
  { name: "waist_cm", label: "Waist (cm)" },
  { name: "hip_cm", label: "Hips (cm)" },
] as const;

export interface StepBodyProfileProps {
  onContinue: () => void;
  onSkip: () => void;
}

function StepBodyProfile({ onContinue, onSkip }: StepBodyProfileProps) {
  const upsertMutation = useUpsertBodyProfile();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BodyMeasurementsFormValues>({
    resolver: zodResolver(withBodyShapeRule(bodyMeasurementsSchema)),
  });
  const bodyCategory = watch("body_category") || "";
  const isKids = findBodyCategory(bodyCategory)?.isKids ?? false;

  const onSubmit = handleSubmit(async (values) => {
    await upsertMutation.mutateAsync({
      height_cm: values.height_cm ?? null,
      weight_kg: values.weight_kg ?? null,
      chest_cm: values.chest_cm ?? null,
      waist_cm: values.waist_cm ?? null,
      hip_cm: values.hip_cm ?? null,
      body_category: (values.body_category || null) as BodyCategory | null,
      body_shape: values.body_shape || null,
    });
    onContinue();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Your body profile</h2>
        <p className="text-sm text-muted-foreground">
          Measurements help try-on results and size recommendations fit you better. All optional.
        </p>
      </div>

      <BodyShapePicker
        idPrefix="onboarding"
        value={{ category: bodyCategory, shape: watch("body_shape") || "" }}
        onChange={({ category, shape }) => {
          setValue("body_category", category, { shouldDirty: true });
          setValue("body_shape", shape, { shouldDirty: true, shouldValidate: !!shape });
        }}
        error={errors.body_shape?.message}
      />

      {isKids && (
        <p className="text-sm text-muted-foreground">
          Kids&apos; clothes are sized by height — that&apos;s the one measurement we need.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      {upsertMutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {upsertMutation.error instanceof ApiError
            ? upsertMutation.error.message
            : "Something went wrong. Please try again."}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" isLoading={upsertMutation.isPending}>
          Continue
        </Button>
        <Button type="button" variant="ghost" onClick={onSkip} disabled={upsertMutation.isPending}>
          Skip for now
        </Button>
      </div>
    </form>
  );
}

export { StepBodyProfile };
