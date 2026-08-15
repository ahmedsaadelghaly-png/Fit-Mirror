import { z } from "zod";

/**
 * Validates process.env at startup so a missing/malformed environment
 * variable fails loudly at build/boot time, not with a confusing runtime
 * error deep inside a component. Only NEXT_PUBLIC_* variables are safe to
 * read on the client — see docs/frontend/FRONTEND_ARCHITECTURE.md.
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:8000/api/v1"),
  NEXT_PUBLIC_APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  /**
   * Optional. The backend exposes no "resolve this storage key to a
   * downloadable URL" endpoint (see backend `StorageService.get_download_url`,
   * which is never called from an API route — only
   * `docs/frontend/SHOPPER_APP.md` "API contract mismatches" documents this
   * gap). If the bucket has a public base URL, set this so
   * shared/utils/resolve-image-url.ts can build `${base}/${key}` directly;
   * otherwise wardrobe/try-on images fall back to a placeholder icon.
   */
  NEXT_PUBLIC_S3_PUBLIC_BASE_URL: z.string().url().optional(),
  /**
   * Optional. Browser-reachable storage origin, used ONLY to widen the CSP
   * connect-src so the browser is allowed to PUT directly to a pre-signed
   * upload URL (see features/shopper/hooks/use-upload.ts and
   * lib/security/headers.ts). Deliberately separate from
   * NEXT_PUBLIC_S3_PUBLIC_BASE_URL above: that one also changes what URLs
   * resolve-image-url.ts tries to load images from (requires a public-read
   * bucket); this one only affects what the browser's CSP permits.
   */
  NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_S3_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL,
  NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL: process.env.NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL,
});

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration — see console output above.");
}

export const env = parsed.data;
