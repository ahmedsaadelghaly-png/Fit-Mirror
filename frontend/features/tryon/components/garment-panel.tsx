"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UploadState } from "@/features/shopper/hooks/use-upload";
import { ImageUploadField } from "@/shared/components/image-upload-field";

export interface GarmentPanelProps {
  upload: UploadState & { upload: (file: File) => Promise<string>; reset: () => void };
  disabled?: boolean;
}

function GarmentPanel({ upload, disabled }: GarmentPanelProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Garment</CardTitle>
        <CardDescription>The item you want to try on</CardDescription>
      </CardHeader>
      <div className="px-6 pb-6">
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
      </div>
    </Card>
  );
}

export { GarmentPanel };
