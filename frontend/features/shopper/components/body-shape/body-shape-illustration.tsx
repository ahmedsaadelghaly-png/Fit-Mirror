import { cn } from "@/lib/utils";
import type { BodyShapeOption } from "@/features/shopper/body-shapes";

export interface BodyShapeIllustrationProps {
  proportions: BodyShapeOption["proportions"];
  /** Kids' figures: shorter body, proportionally larger head. */
  isKids?: boolean;
  className?: string;
}

const CENTER = 60;
const BASELINE = 232;

type Point = [number, number];

/** Midpoint-smoothed closed path through `points` (quadratic curves). */
function smoothClosedPath(points: Point[]): string {
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const fmt = ([x, y]: Point) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  const at = (index: number): Point => points[(index + points.length) % points.length] as Point;
  let d = `M ${fmt(mid(at(-1), at(0)))}`;
  points.forEach((point, index) => {
    d += ` Q ${fmt(point)} ${fmt(mid(point, at(index + 1)))}`;
  });
  return `${d} Z`;
}

/**
 * Dress-form silhouette drawn from four half-widths (shoulder, bust,
 * waist, hip), so every body shape — women's, men's and kids' — comes
 * from the same generator and reads consistently. Dashed guides mark the
 * bust, waist and hip lines the shape is defined by. Decorative: the
 * picker labels each option in text.
 */
function BodyShapeIllustration({
  proportions,
  isKids = false,
  className,
}: BodyShapeIllustrationProps) {
  const { shoulder, bust, waist, hip } = proportions;
  const scale = isKids ? 0.8 : 1;
  const y = (value: number) => BASELINE - (BASELINE - value) * scale;
  const knee = Math.max(8, hip * 0.42);

  // Right half, top to bottom along the outside, then back up the inner leg.
  const right: Point[] = [
    [7, 40],
    [7, 47],
    [shoulder - 3, 53],
    [shoulder, 60],
    [bust, 82],
    [waist, 110],
    [hip, 138],
    [hip - 2, 158],
    [knee, 196],
    [10, 230],
    [3, 232],
    [3.5, 196],
    [2, 165],
  ];
  const outline: Point[] = [
    ...right.map(([dx, py]): Point => [CENTER + dx, y(py)]),
    ...[...right].reverse().map(([dx, py]): Point => [CENTER - dx, y(py)]),
  ];

  const neckY = y(40);
  const headRy = isKids ? 16 : 14;
  const headRx = isKids ? 14 : 12;
  const guides: [number, number][] = [
    [bust, 82],
    [waist, 110],
    [hip, 138],
  ];

  return (
    <svg
      // Cropped to the widest possible figure (half-width 30 + guide overhang)
      // so the silhouette fills its card and shape differences stay legible.
      viewBox="24 6 72 230"
      className={cn("h-full w-auto", className)}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse
        cx={CENTER}
        cy={neckY - headRy + 2}
        rx={headRx}
        ry={headRy}
        className="fill-primary/25 stroke-primary-text"
        strokeWidth={1.5}
      />
      <path
        d={smoothClosedPath(outline)}
        className="fill-primary/25 stroke-primary-text"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {guides.map(([half, level]) => (
        <line
          key={level}
          x1={CENTER - half - 4}
          x2={CENTER + half + 4}
          y1={y(level)}
          y2={y(level)}
          className="stroke-foreground/40"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      ))}
    </svg>
  );
}

export { BodyShapeIllustration };
