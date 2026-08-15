"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStylePreferences } from "@/features/shopper/hooks/use-style-preferences";
import {
  COLOR_PALETTE,
  PREFERRED_FITS,
  STYLE_TAGS,
  type StylePreferencesFormValues,
  stylePreferencesSchema,
} from "@/features/shopper/schemas";

function formatOptionLabel(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export interface StepStylePreferencesProps {
  onContinue: () => void;
  onSkip: () => void;
}

function StepStylePreferences({ onContinue, onSkip }: StepStylePreferencesProps) {
  const { preferences, savePreferences } = useStylePreferences();

  const { watch, setValue, handleSubmit } = useForm<StylePreferencesFormValues>({
    resolver: zodResolver(stylePreferencesSchema),
    defaultValues: {
      preferred_fit:
        (preferences.preferred_fit as StylePreferencesFormValues["preferred_fit"]) ?? "",
      favorite_colors: preferences.favorite_colors as StylePreferencesFormValues["favorite_colors"],
      style_preferences:
        preferences.style_preferences as StylePreferencesFormValues["style_preferences"],
    },
  });

  const favoriteColors = watch("favorite_colors") ?? [];
  const styleTags = watch("style_preferences") ?? [];

  const toggleInArray = <T,>(current: T[], value: T): T[] =>
    current.includes(value) ? current.filter((item) => item !== value) : [...current, value];

  const onSubmit = handleSubmit((values) => {
    savePreferences({
      preferred_fit: values.preferred_fit || null,
      favorite_colors: values.favorite_colors,
      style_preferences: values.style_preferences,
    });
    onContinue();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Your style preferences</h2>
        <p className="text-sm text-muted-foreground">
          Tell us how you like to dress — you can change this anytime in Settings.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="preferred_fit">Preferred fit</Label>
        <Select
          value={watch("preferred_fit") || undefined}
          onValueChange={(value) =>
            setValue("preferred_fit", value as StylePreferencesFormValues["preferred_fit"])
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
                onCheckedChange={() => setValue("style_preferences", toggleInArray(styleTags, tag))}
              />
              {formatOptionLabel(tag)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit">Continue</Button>
        <Button type="button" variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </form>
  );
}

export { StepStylePreferences };
