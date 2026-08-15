import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class lists, resolving conflicting utility classes
 * (e.g. `px-2` vs `px-4`) in favor of the last one — the standard
 * shadcn/ui convention used by every component in components/ui/.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
