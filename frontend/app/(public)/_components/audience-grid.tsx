import Link from "next/link";

import { FashionImage } from "@/shared/components/fashion-image";

const AUDIENCES = [
  {
    label: "Women",
    detail: "Hourglass, pear, apple, rectangle & inverted triangle",
    src: "/images/models/woman-milan.jpg",
    alt: "Woman in a light blue coat in a city square",
  },
  {
    label: "Men",
    detail: "Rectangle, triangle, inverted triangle, oval & trapezoid",
    src: "/images/models/man-leather.jpg",
    alt: "Man in a black leather jacket on a brick rooftop",
  },
  {
    label: "Girls",
    detail: "Slim, regular & plus fits, sized by height",
    src: "/images/models/girl-garden.jpg",
    alt: "Girl in a polka-dot top among red flowers",
  },
  {
    label: "Boys",
    detail: "Slim, regular & husky fits, sized by height",
    src: "/images/models/boy-skate.jpg",
    alt: "Boy in a track jacket riding a skateboard",
  },
];

/**
 * "Made for every body" — the four body-profile categories (see the Body
 * Profile page's shape picker), each as a full-bleed photo card.
 */
function AudienceGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {AUDIENCES.map((audience) => (
        <Link
          key={audience.label}
          href="/register"
          className="group relative overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FashionImage
            src={audience.src}
            alt={audience.alt}
            aspect="portrait"
            className="transition-transform duration-700 ease-signature group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white md:p-5">
            <p className="font-display text-xl font-semibold md:text-2xl">{audience.label}</p>
            <p className="mt-1 text-xs text-white/80 md:text-sm">{audience.detail}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export { AudienceGrid };
