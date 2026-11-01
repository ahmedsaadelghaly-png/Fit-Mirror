import { CheckCircle2, Clock, Package, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FashionImage } from "@/shared/components/fashion-image";
import type { Store } from "@/types/domain";

export interface StoreSummaryCardProps {
  store: Store;
}

/** Photographic store banner — the Brand dashboard's single h1 and primary actions. */
function StoreSummaryCard({ store }: StoreSummaryCardProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-foreground text-white">
      <FashionImage
        src="/images/editorial/boutique.jpg"
        alt=""
        aspect="wide"
        className="absolute inset-0 aspect-auto h-full w-full"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
      <div className="relative flex flex-col gap-5 p-6 md:p-10">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium backdrop-blur">
            {store.is_verified ? (
              <>
                <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" /> Verified
              </>
            ) : (
              <>
                <Clock className="size-3.5" aria-hidden="true" /> Verification pending
              </>
            )}
          </span>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">{store.name}</h1>
          <p className="text-sm text-white/70">fitmirror.ai/store/{store.slug}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/brand/products/new">
              <Plus className="size-4" aria-hidden="true" /> Add a product
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/brand/products">
              <Package className="size-4" aria-hidden="true" /> Manage catalog
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export { StoreSummaryCard };
