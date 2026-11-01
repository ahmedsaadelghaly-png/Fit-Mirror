import type { BodyCategory } from "@/types/domain";

/**
 * Body categories and the shapes offered for each — mirrors the backend's
 * `BODY_SHAPES_BY_CATEGORY` (backend/app/models/user.py), which validates
 * every save. Kids' entries are fit types (childrenswear is sized by
 * height), not curve-based shapes.
 *
 * `proportions` are half-widths (in the illustration's 120-unit-wide
 * viewBox) at shoulder, bust/chest, waist and hip — the only inputs
 * `BodyShapeIllustration` needs to draw the silhouette.
 */
export interface BodyShapeOption {
  value: string;
  label: string;
  description: string;
  proportions: { shoulder: number; bust: number; waist: number; hip: number };
}

export interface BodyCategoryOption {
  value: BodyCategory;
  label: string;
  /** Static photo for the category card (public/images). */
  image: string;
  isKids: boolean;
  shapes: BodyShapeOption[];
}

export const BODY_CATEGORIES: BodyCategoryOption[] = [
  {
    value: "women",
    label: "Women",
    image: "/images/models/woman-milan.jpg",
    isKids: false,
    shapes: [
      {
        value: "hourglass",
        label: "Hourglass",
        description: "Bust and hips balanced, clearly defined waist.",
        proportions: { shoulder: 22, bust: 22, waist: 14, hip: 23 },
      },
      {
        value: "pear",
        label: "Pear",
        description: "Hips wider than bust and shoulders.",
        proportions: { shoulder: 18, bust: 18, waist: 15, hip: 26 },
      },
      {
        value: "apple",
        label: "Apple",
        description: "Fuller through the middle, slimmer legs.",
        proportions: { shoulder: 21, bust: 23, waist: 23, hip: 21 },
      },
      {
        value: "rectangle",
        label: "Rectangle",
        description: "Shoulders, waist and hips similar in width.",
        proportions: { shoulder: 20, bust: 20, waist: 18, hip: 20 },
      },
      {
        value: "inverted_triangle",
        label: "Inverted triangle",
        description: "Shoulders or bust wider than hips.",
        proportions: { shoulder: 26, bust: 23, waist: 17, hip: 18 },
      },
    ],
  },
  {
    value: "men",
    label: "Men",
    image: "/images/models/man-leather.jpg",
    isKids: false,
    shapes: [
      {
        value: "rectangle",
        label: "Rectangle",
        description: "Shoulders, waist and hips in a straight line.",
        proportions: { shoulder: 25, bust: 24, waist: 22, hip: 22 },
      },
      {
        value: "triangle",
        label: "Triangle",
        description: "Hips and waist wider than shoulders.",
        proportions: { shoulder: 21, bust: 22, waist: 22, hip: 25 },
      },
      {
        value: "inverted_triangle",
        label: "Inverted triangle",
        description: "Broad shoulders and chest, narrow waist.",
        proportions: { shoulder: 30, bust: 27, waist: 19, hip: 20 },
      },
      {
        value: "oval",
        label: "Oval",
        description: "Fuller midsection, rounder through the waist.",
        proportions: { shoulder: 24, bust: 26, waist: 28, hip: 24 },
      },
      {
        value: "trapezoid",
        label: "Trapezoid",
        description: "Shoulders a little wider than a trim waist.",
        proportions: { shoulder: 28, bust: 26, waist: 21, hip: 22 },
      },
    ],
  },
  {
    value: "girls",
    label: "Girls",
    image: "/images/models/girl-garden.jpg",
    isKids: true,
    shapes: [
      {
        value: "slim",
        label: "Slim",
        description: "Narrower build — may prefer adjustable waists.",
        proportions: { shoulder: 16, bust: 15, waist: 13, hip: 15 },
      },
      {
        value: "regular",
        label: "Regular",
        description: "Standard fit for their height.",
        proportions: { shoulder: 17, bust: 17, waist: 16, hip: 17 },
      },
      {
        value: "plus",
        label: "Plus",
        description: "Fuller build — we size up one for comfort.",
        proportions: { shoulder: 19, bust: 20, waist: 20, hip: 20 },
      },
    ],
  },
  {
    value: "boys",
    label: "Boys",
    image: "/images/models/boy-skate.jpg",
    isKids: true,
    shapes: [
      {
        value: "slim",
        label: "Slim",
        description: "Narrower build — may prefer adjustable waists.",
        proportions: { shoulder: 17, bust: 15, waist: 13, hip: 14 },
      },
      {
        value: "regular",
        label: "Regular",
        description: "Standard fit for their height.",
        proportions: { shoulder: 18, bust: 17, waist: 16, hip: 16 },
      },
      {
        value: "husky",
        label: "Husky",
        description: "Sturdier build — we size up one for comfort.",
        proportions: { shoulder: 20, bust: 20, waist: 21, hip: 20 },
      },
    ],
  },
];

export function findBodyCategory(value: string | null | undefined) {
  return BODY_CATEGORIES.find((category) => category.value === value);
}

export function isShapeInCategory(category: string | null | undefined, shape: string): boolean {
  return Boolean(findBodyCategory(category)?.shapes.some((option) => option.value === shape));
}
