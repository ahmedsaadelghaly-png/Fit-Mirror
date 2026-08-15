import { MOCK_REPORTS } from "@/api/admin/mock-data";
import { delay } from "@/api/admin/shared";
import type { PlatformReports } from "@/types/admin";

/** PLACEHOLDER — no analytics/reporting endpoint exists anywhere in the backend. See docs/frontend/ADMIN_APP.md. */
export async function fetchPlatformReports(): Promise<PlatformReports> {
  await delay();
  return MOCK_REPORTS;
}
