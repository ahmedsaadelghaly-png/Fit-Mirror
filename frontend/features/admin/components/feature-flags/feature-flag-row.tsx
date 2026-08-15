"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { useUpdateFeatureFlag } from "@/features/admin/hooks/use-update-feature-flag";
import {
  FEATURE_FLAG_ENVIRONMENTS,
  type FeatureFlagUpdateFormValues,
  featureFlagUpdateSchema,
} from "@/features/admin/schemas";
import type { FeatureFlag } from "@/types/admin";

export interface FeatureFlagRowProps {
  flag: FeatureFlag;
}

/**
 * Toggling a flag, its environment scope, and its rollout percentage all
 * persist to localStorage (see api/admin/feature-flags.ts) — the one
 * admin action in this whole phase designed to durably "stick" across a
 * refresh, since that's the entire point of a feature-flag UI.
 */
function FeatureFlagRow({ flag }: FeatureFlagRowProps) {
  const updateMutation = useUpdateFeatureFlag();

  const { watch, setValue, handleSubmit } = useForm<FeatureFlagUpdateFormValues>({
    resolver: zodResolver(featureFlagUpdateSchema),
    defaultValues: { environment: flag.environment, rolloutPercentage: flag.rolloutPercentage },
  });

  const saveChanges = handleSubmit((values) => {
    updateMutation.mutate({ key: flag.key, changes: values });
  });

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{flag.label}</span>
          <span className="font-mono text-xs text-muted-foreground">{flag.key}</span>
        </div>
      </TableCell>
      <TableCell className="max-w-xs text-sm text-muted-foreground">{flag.description}</TableCell>
      <TableCell>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={flag.enabled}
            onCheckedChange={(checked) =>
              updateMutation.mutate({ key: flag.key, changes: { enabled: checked === true } })
            }
            aria-label={`Enable ${flag.label}`}
          />
          <span className="text-sm">{flag.enabled ? "Enabled" : "Disabled"}</span>
        </label>
      </TableCell>
      <TableCell>
        <Select
          value={watch("environment")}
          onValueChange={(value) => {
            setValue("environment", value as FeatureFlagUpdateFormValues["environment"]);
            saveChanges();
          }}
        >
          <SelectTrigger className="w-32" aria-label={`Environment for ${flag.label}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FEATURE_FLAG_ENVIRONMENTS.map((env) => (
              <SelectItem key={env} value={env} className="capitalize">
                {env}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            inputMode="numeric"
            className="w-20"
            aria-label={`Rollout percentage for ${flag.label}`}
            value={watch("rolloutPercentage")}
            onChange={(event) => setValue("rolloutPercentage", Number(event.target.value))}
            onBlur={saveChanges}
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

export { FeatureFlagRow };
