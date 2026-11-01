"use client";

import { Check, Ruler, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useBodyProfiles } from "@/features/shopper/hooks/use-body-profiles";
import { useReportFit } from "@/features/shopper/hooks/use-report-fit";
import { useSizeRecommendation } from "@/features/shopper/hooks/use-size-recommendation";
import { useUpload } from "@/features/shopper/hooks/use-upload";
import { useCreateTryOnJob } from "@/features/tryon/hooks/use-create-tryon-job";
import { ImageUploadField } from "@/shared/components/image-upload-field";
import { ResolvedImage } from "@/shared/components/resolved-image";
import { describeFit } from "@/shared/utils/fit-summary";
import type { BodyProfile, Product } from "@/types/domain";
import type { FitVerdict } from "@/types/shopper";

export interface ProductTryOnDialogProps {
  /** The product to try on; `null` closes the dialog. */
  product: Product | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Catalog try-on: pick who it's for (any family profile), get their size,
 * choose a size and a photo, then `POST /tryon` with the variant — the
 * worker uses the product's garment image. Lands on the try-on workspace
 * with the new job selected.
 */
function ProductTryOnDialog({ product, onOpenChange }: ProductTryOnDialogProps) {
  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        {product && <ProductTryOnPanel key={product.id} product={product} />}
      </DialogContent>
    </Dialog>
  );
}

/** Kids' items default to a matching child's profile; everything else to the shopper's own. */
export function pickDefaultProfile(
  profiles: BodyProfile[],
  audience: Product["audience"],
): BodyProfile | undefined {
  const sameAudience = profiles.filter((profile) => profile.body_category === audience);
  if (audience === "girls" || audience === "boys") return sameAudience[0] ?? profiles[0];
  return profiles.find((profile) => profile.is_primary) ?? profiles[0];
}

function ProductTryOnPanel({ product }: { product: Product }) {
  const router = useRouter();
  const profilesQuery = useBodyProfiles();
  const sizing = useSizeRecommendation();
  const upload = useUpload();
  const createJob = useCreateTryOnJob();

  const profiles = profilesQuery.data ?? [];
  const [profileId, setProfileId] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [isReplacingPhoto, setIsReplacingPhoto] = useState(false);

  const profile =
    profiles.find((candidate) => candidate.id === profileId) ??
    pickDefaultProfile(profiles, product.audience);
  const recommendation =
    sizing.data && sizing.data.body_profile_id === (profile?.id ?? null) ? sizing.data : null;
  const selectedVariant =
    product.variants.find((variant) => variant.id === variantId) ??
    product.variants.find(
      (variant) => variant.size_label === recommendation?.recommended_size_label,
    ) ??
    null;

  const savedPhotoKey = isReplacingPhoto ? null : (profile?.reference_image_key ?? null);
  const photoKey = upload.objectKey ?? savedPhotoKey;
  const sizingError = sizing.error instanceof ApiError ? sizing.error : null;
  const whose = profile && !profile.is_primary ? `${profile.name}'s` : "your";

  const chooseProfile = (next: BodyProfile) => {
    setProfileId(next.id);
    setVariantId(null);
    setIsReplacingPhoto(false);
    upload.reset();
    sizing.reset();
  };

  const startTryOn = () => {
    if (!selectedVariant || !photoKey) return;
    createJob.mutate(
      { user_image_key: photoKey, product_variant_id: selectedVariant.id },
      { onSuccess: (accepted) => router.push(`/shopper/tryon?job=${accepted.job_id}`) },
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
      <ResolvedImage
        imageKey={product.primary_image_key}
        alt={product.title}
        className="aspect-[3/4] w-full rounded-lg object-cover"
      />

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1 pr-6">
          <DialogTitle className="font-display text-xl">{product.title}</DialogTitle>
          <p className="text-sm font-medium">
            {product.currency} {product.price}
          </p>
          <DialogDescription>
            {product.description ?? "Pick who it's for, a size and a photo to try it on."}
          </DialogDescription>
        </div>

        <section aria-labelledby="tryon-who" className="flex flex-col gap-2">
          <h3 id="tryon-who" className="text-sm font-medium">
            Who&apos;s it for?
          </h3>
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <Link href="/shopper/profile" className="underline">
                Set up your body profile
              </Link>{" "}
              to get size recommendations.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profiles.map((candidate) => (
                <Button
                  key={candidate.id}
                  type="button"
                  size="sm"
                  variant={candidate.id === profile?.id ? "default" : "outline"}
                  aria-pressed={candidate.id === profile?.id}
                  onClick={() => chooseProfile(candidate)}
                  className="rounded-full"
                >
                  {candidate.is_primary ? "Me" : candidate.name}
                </Button>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="tryon-size" className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="tryon-size" className="text-sm font-medium">
              Size
            </h3>
            {profile && !recommendation && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={sizing.isPending}
                onClick={() => sizing.mutate({ productId: product.id, bodyProfileId: profile.id })}
              >
                <Ruler className="size-3.5" /> Find {whose} size
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="tryon-size">
            {product.variants.map((variant) => {
              const isSelected = variant.id === selectedVariant?.id;
              const isRecommended = variant.size_label === recommendation?.recommended_size_label;
              return (
                <button
                  key={variant.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setVariantId(variant.id)}
                  className={cn(
                    "relative min-w-12 rounded-md border px-3 py-2 text-sm transition-colors hover:border-primary/50",
                    isSelected && "border-primary bg-primary/5 ring-1 ring-primary",
                  )}
                >
                  {variant.size_label}
                  {variant.color && (
                    <span className="block text-xs text-muted-foreground">{variant.color}</span>
                  )}
                  {isRecommended && (
                    <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" aria-label="Recommended" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {recommendation && (
            <p className="text-xs" aria-live="polite">
              <span className="font-medium">
                Recommended: {recommendation.recommended_size_label} (
                {Math.round(recommendation.confidence * 100)}% match)
              </span>
              <span className="block text-muted-foreground">{recommendation.fit_note}</span>
              {recommendation.size_chart === "brand" && (
                <span className="block text-muted-foreground">
                  Based on the brand&apos;s own size chart.
                </span>
              )}
            </p>
          )}
          {describeFit(recommendation?.fit_feedback) && (
            <p className="text-xs font-medium">{describeFit(recommendation?.fit_feedback)}</p>
          )}
          {selectedVariant && (
            <FitReport
              key={selectedVariant.id}
              productId={product.id}
              sizeLabel={selectedVariant.size_label}
            />
          )}
          {sizingError && (
            <p className="text-xs text-destructive" role="alert">
              {sizingError.message}{" "}
              {sizingError.status === 422 && (
                <Link href="/shopper/profile" className="underline">
                  Update body profile
                </Link>
              )}
            </p>
          )}
        </section>

        <section aria-labelledby="tryon-photo" className="flex flex-col gap-2">
          <h3 id="tryon-photo" className="text-sm font-medium">
            Photo
          </h3>
          {savedPhotoKey && !upload.objectKey ? (
            <div className="flex items-center gap-3">
              <ResolvedImage
                imageKey={savedPhotoKey}
                alt={`${profile?.is_primary ? "Your" : `${profile?.name}'s`} profile photo`}
                className="aspect-[3/4] w-16 rounded-md object-cover"
              />
              <div className="flex flex-col items-start gap-1">
                <span className="text-sm">Using the saved profile photo</span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() => setIsReplacingPhoto(true)}
                >
                  Use a different photo
                </Button>
              </div>
            </div>
          ) : (
            <ImageUploadField
              label="Drop a full-length photo here, or click to browse"
              hint="PNG, JPG or WebP, up to 10MB"
              status={upload.status}
              previewUrl={upload.previewUrl}
              progress={upload.progress}
              error={upload.error}
              onFileSelected={(file) => upload.upload(file).catch(() => undefined)}
              onClear={upload.reset}
            />
          )}
        </section>

        {createJob.isError && (
          <p role="alert" className="text-sm text-destructive">
            {createJob.error instanceof ApiError
              ? createJob.error.message
              : "Couldn't start the try-on. Please try again."}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={startTryOn}
            disabled={!selectedVariant || !photoKey}
            isLoading={createJob.isPending}
          >
            <Sparkles className="size-4" /> Try it on
          </Button>
          {(!selectedVariant || !photoKey) && (
            <span className="text-xs text-muted-foreground">
              {!selectedVariant ? "Choose a size" : "Add a photo"} to continue.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const FIT_OPTIONS: { value: FitVerdict; label: string }[] = [
  { value: "small", label: "Runs small" },
  { value: "true_to_size", label: "True to size" },
  { value: "large", label: "Runs large" },
];

/** "Already own it?" — fit feedback that tunes everyone's size recommendations. */
function FitReport({ productId, sizeLabel }: { productId: string; sizeLabel: string }) {
  const reportMutation = useReportFit();

  if (reportMutation.isSuccess) {
    return (
      <p className="text-xs text-muted-foreground" role="status">
        Thanks — your fit report helps other shoppers pick the right size.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground">Already own it? How does {sizeLabel} fit?</span>
      {FIT_OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant="outline"
          size="sm"
          className="h-7 rounded-full px-2.5 text-xs"
          disabled={reportMutation.isPending}
          onClick={() =>
            reportMutation.mutate({
              product_id: productId,
              size_label: sizeLabel,
              fit: option.value,
            })
          }
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export { ProductTryOnDialog };
