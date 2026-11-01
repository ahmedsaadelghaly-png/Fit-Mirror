"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { BODY_CATEGORIES, findBodyCategory } from "@/features/shopper/body-shapes";
import { BodyShapeIllustration } from "@/features/shopper/components/body-shape/body-shape-illustration";
import { FashionImage } from "@/shared/components/fashion-image";
import type { BodyCategory } from "@/types/domain";

export interface BodyShapeValue {
  category: BodyCategory | "";
  shape: string;
}

export interface BodyShapePickerProps {
  value: BodyShapeValue;
  onChange: (value: BodyShapeValue) => void;
  /** Shown under the shape group (e.g. a server-side validation message). */
  error?: string;
  /** Prefix for input names/ids, so two pickers can share a page. */
  idPrefix?: string;
}

const optionCard =
  "relative flex cursor-pointer rounded-xl border bg-surface transition-colors hover:border-primary/50 " +
  "has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:ring-1 has-[:checked]:ring-primary " +
  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring";

/**
 * Two-step picker: who the profile is for (women, men, girls, boys), then
 * the body shape — or, for kids, the fit type — illustrated per category.
 * Native radio inputs underneath, so arrow-key navigation and screen
 * reader semantics come for free; switching category clears a shape that
 * doesn't belong to the new one (mirroring the backend rule).
 */
function BodyShapePicker({ value, onChange, error, idPrefix = "body" }: BodyShapePickerProps) {
  const category = findBodyCategory(value.category);

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-medium">Who is this profile for?</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BODY_CATEGORIES.map((option) => (
            <label key={option.value} className={cn(optionCard, "items-center gap-3 p-3")}>
              <input
                type="radio"
                name={`${idPrefix}-category`}
                value={option.value}
                checked={value.category === option.value}
                onChange={() =>
                  onChange({
                    category: option.value,
                    shape: option.shapes.some((shape) => shape.value === value.shape)
                      ? value.shape
                      : "",
                  })
                }
                className="sr-only"
              />
              <FashionImage
                src={option.image}
                alt=""
                aspect="square"
                className="size-12 shrink-0 rounded-full"
              />
              <span className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.isKids ? "Sized by height" : "Adult sizes"}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {category ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-medium">
            {category.isKids ? "Fit type" : "Body shape"}{" "}
            <span className="font-normal text-muted-foreground">
              — {category.isKids ? "how their clothes usually fit" : "pick the closest match"}
            </span>
          </legend>
          <div
            className={cn(
              "grid gap-3",
              category.isKids ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
            )}
          >
            {category.shapes.map((shape) => {
              const checked = value.shape === shape.value;
              return (
                <label
                  key={shape.value}
                  className={cn(optionCard, "flex-col items-center gap-2 p-3 text-center")}
                >
                  <input
                    type="radio"
                    name={`${idPrefix}-shape`}
                    value={shape.value}
                    checked={checked}
                    onChange={() => onChange({ category: category.value, shape: shape.value })}
                    className="sr-only"
                  />
                  {checked && (
                    <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" aria-hidden="true" />
                    </span>
                  )}
                  <span className="flex h-40 items-end justify-center">
                    <BodyShapeIllustration
                      proportions={shape.proportions}
                      isKids={category.isKids}
                    />
                  </span>
                  <span className="text-sm font-medium">{shape.label}</span>
                  <span className="text-xs text-muted-foreground">{shape.description}</span>
                </label>
              );
            })}
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </fieldset>
      ) : (
        <p className="text-sm text-muted-foreground">
          Choose who this profile is for to see the matching body shapes.
        </p>
      )}
    </div>
  );
}

export { BodyShapePicker };
