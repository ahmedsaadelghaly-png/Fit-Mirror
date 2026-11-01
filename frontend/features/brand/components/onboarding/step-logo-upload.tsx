"use client";

import { Button } from "@/components/ui/button";
import { useUpload } from "@/features/shopper/hooks/use-upload";
import { useStoreBusinessInfo } from "@/features/brand/hooks/use-store-business-info";
import { ImageUploadField } from "@/shared/components/image-upload-field";

export interface StepLogoUploadProps {
  onContinue: () => void;
  onSkip: () => void;
}

/**
 * Reuses features/shopper/hooks/use-upload.ts — the pre-signed-URL upload
 * flow is identical regardless of what the image is for — then saves the
 * key as the store logo with `PATCH /store/me`.
 */
const EMPTY_BUSINESS_INFO = {
  category: null,
  description: null,
  social_links: { website: null, instagram: null, tiktok: null },
  logo_image_key: null,
};

function StepLogoUpload({ onContinue, onSkip }: StepLogoUploadProps) {
  const upload = useUpload();
  const { data: businessInfo, save } = useStoreBusinessInfo();

  const handleContinue = () => {
    if (upload.objectKey) {
      save.mutate(
        { ...(businessInfo ?? EMPTY_BUSINESS_INFO), logo_image_key: upload.objectKey },
        { onSuccess: onContinue },
      );
    } else {
      onContinue();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Add your store logo</h2>
        <p className="text-sm text-muted-foreground">
          Shown on your storefront and in your dashboard. Square images work best.
        </p>
      </div>

      <ImageUploadField
        label="Drop your logo here, or click to browse"
        hint="PNG or JPG, up to 10MB"
        status={upload.status}
        previewUrl={upload.previewUrl}
        progress={upload.progress}
        error={upload.error}
        onFileSelected={(file) => upload.upload(file).catch(() => undefined)}
        onClear={upload.reset}
      />

      <div className="flex gap-2">
        <Button type="button" onClick={handleContinue} isLoading={save.isPending}>
          Continue
        </Button>
        <Button type="button" variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}

export { StepLogoUpload };
