import { HeartHandshake, Leaf, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { FashionImage, ModelImage } from "@/shared/components/fashion-image";

export const metadata: Metadata = {
  title: "About",
  description: "Why FitMirror AI exists.",
};

const values = [
  {
    icon: HeartHandshake,
    title: "Fit for every body",
    description:
      "Women, men, girls and boys each get their own body shapes and size logic — not one chart stretched to fit everyone.",
  },
  {
    icon: ShieldCheck,
    title: "Your photos are yours",
    description:
      "Photos are used to render your try-ons and nothing else. They're never shown to brands or other shoppers.",
  },
  {
    icon: Leaf,
    title: "Fewer returns",
    description:
      "Every garment that fits the first time is one less parcel shipped back — better for shoppers, brands and the planet.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="container pt-10 md:pt-14">
        <div className="relative overflow-hidden rounded-2xl">
          <FashionImage
            src="/images/editorial/rail-neutral.jpg"
            alt="Neutral knitwear hanging on a clothing rail"
            aspect="wide"
            className="min-h-[18rem] md:aspect-[21/9]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-12">
            <Badge variant="eyebrow" className="text-white/70">
              About
            </Badge>
            <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight text-white md:text-5xl">
              Buying clothes online shouldn&apos;t be a guessing game.
            </h1>
          </div>
        </div>
      </section>

      <section className="container grid items-center gap-10 py-16 md:py-24 lg:grid-cols-[1fr_0.8fr] lg:gap-16">
        <div className="flex flex-col gap-6 text-lg leading-relaxed text-muted-foreground">
          <p>
            FitMirror AI exists because trying on clothes is the part of shopping that actually
            matters, and it&apos;s the one thing online stores can&apos;t offer — until now. We
            combine virtual try-on, a wardrobe that knows what you own, and a stylist that
            understands your fit to make buying clothes online feel less like a bet.
          </p>
          <p>
            It&apos;s built for two audiences at once: shoppers who want confidence before they buy
            — for themselves and for their kids — and the fashion brands who want fewer returns and
            happier customers.
          </p>
          <p>
            We&apos;re early, and we&apos;d rather be honest than oversell: see exactly what&apos;s
            live on our{" "}
            <Link href="/features" className="text-primary-text underline underline-offset-2">
              features page
            </Link>
            .
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ModelImage
            src="/images/models/woman-pink.jpg"
            alt="Woman in a pink ruffled blouse"
            className="rounded-xl"
          />
          <ModelImage
            src="/images/models/boy-bowtie.jpg"
            alt="Smiling boy in a navy cardigan and bow tie"
            className="mt-10 rounded-xl"
          />
        </div>
      </section>

      <section className="bg-surface">
        <div className="container grid gap-8 py-16 md:grid-cols-3 md:py-20">
          {values.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary-text">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="font-display text-xl font-semibold">{title}</h2>
              <p className="text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
