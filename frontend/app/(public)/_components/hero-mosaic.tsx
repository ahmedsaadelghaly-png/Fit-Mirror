import { CheckCircle2, Ruler, Sparkles } from "lucide-react";

import { FashionImage } from "@/shared/components/fashion-image";

/**
 * Landing hero visual: a three-photo editorial mosaic with two floating
 * "product UI" cards (a finished try-on and a size recommendation), so the
 * first screen shows what the product actually does, not just a mood shot.
 * Purely decorative copy inside the cards — the real flows live in the app.
 */
function HeroMosaic() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="grid grid-cols-5 grid-rows-2 gap-3 md:gap-4">
        <FashionImage
          src="/images/models/woman-yellow.jpg"
          alt="Woman in a yellow tracksuit"
          aspect="portrait"
          className="col-span-3 row-span-2 aspect-auto h-full rounded-xl shadow-lg"
        />
        <FashionImage
          src="/images/models/man-suit.jpg"
          alt="Man in a tailored navy suit"
          aspect="portrait"
          className="col-span-2 rounded-xl shadow-md"
        />
        <FashionImage
          src="/images/models/girl-blue-wall.jpg"
          alt="Girl posing in a denim jacket against a blue wall"
          aspect="portrait"
          className="col-span-2 rounded-xl shadow-md"
        />
      </div>

      <div className="absolute -left-3 top-8 hidden items-center gap-3 rounded-lg border bg-surface/95 px-4 py-3 shadow-lg backdrop-blur sm:flex md:-left-8">
        <span className="flex size-9 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium">Try-on ready</p>
          <p className="text-xs text-muted-foreground">Rendered on your photo</p>
        </div>
      </div>

      <div className="absolute -bottom-5 right-4 flex items-center gap-3 rounded-lg border bg-surface/95 px-4 py-3 shadow-lg backdrop-blur md:-right-6">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary-text">
          <Ruler className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium">
            Your size: <span className="text-primary-text">M</span>
          </p>
          <p className="text-xs text-muted-foreground">95% match from your measurements</p>
        </div>
        <Sparkles className="ml-1 size-4 text-primary" aria-hidden="true" />
      </div>
    </div>
  );
}

export { HeroMosaic };
