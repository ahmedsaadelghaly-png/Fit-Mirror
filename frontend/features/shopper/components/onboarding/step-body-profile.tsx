"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { useUpsertBodyProfile } from "@/features/shopper/hooks/use-upsert-body-profile";
import {
  BODY_SHAPES,
  type BodyMeasurementsFormValues,
  bodyMeasurementsSchema,
} from "@/features/shopper/schemas";

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
    resolver: zodResolver(bodyMeasurementsSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    await upsertMutation.mutateAsync({
      height_cm: values.height_cm ?? null,
      weight_kg: values.weight_kg ?? null,
      chest_cm: values.chest_cm ?? null,
      waist_cm: values.waist_cm ?? null,
      hip_cm: values.hip_cm ?? null,
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="body_shape">Body shape</Label>
          <Select
            value={watch("body_shape") || undefined}
            onValueChange={(value) =>
              setValue("body_shape", value as BodyMeasurementsFormValues["body_shape"])
            }
          >
            <SelectTrigger id="body_shape">
              <SelectValue placeholder="Select a body shape" />
            </SelectTrigger>
            <SelectContent>
              {BODY_SHAPES.map((shape) => (
                <SelectItem key={shape} value={shape}>
                  {formatOptionLabel(shape)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
