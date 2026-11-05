"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UploadState } from "@/features/shopper/hooks/use-upload";
import { ImageUploadField } from "@/shared/components/image-upload-field";
import type { GarmentCategory } from "@/types/shopper";

const GARMENT_CATEGORIES: { value: GarmentCategory; label: string }[] = [
  { value: "upper_body", label: "Top or jacket" },
  { value: "lower_body", label: "Trousers or skirt" },
  { value: "dresses", label: "Dress" },
];

export interface GarmentPanelProps {
  upload: UploadState & { upload: (file: File) => Promise<string>; reset: () => void };
  disabled?: boolean;
  category: GarmentCategory;
  onCategoryChange: (category: GarmentCategory) => void;
}

function GarmentPanel({ upload, disabled, category, onCategoryChange }: GarmentPanelProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Garment</CardTitle>
        <CardDescription>The item you want to try on</CardDescription>
      </CardHeader>
      <div className="flex flex-col gap-4 px-6 pb-6">
        <ImageUploadField
          label="Drop a garment photo here, or click to browse"
          hint="PNG or JPG, up to 10MB"
          status={upload.status}
          previewUrl={upload.previewUrl}
          progress={upload.progress}
          error={upload.error}
          onFileSelected={(file) => upload.upload(file).catch(() => undefined)}
          onClear={upload.reset}
          disabled={disabled}
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="garment-category">What is it?</Label>
          <Select
            value={category}
            onValueChange={(value) => onCategoryChange(value as GarmentCategory)}
            disabled={disabled}
          >
            <SelectTrigger id="garment-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GARMENT_CATEGORIES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}

export { GarmentPanel };
