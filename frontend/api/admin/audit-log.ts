import { MOCK_AUDIT_LOG } from "@/api/admin/mock-data";
import { delay } from "@/api/admin/shared";
import type { AuditLogEntry } from "@/types/admin";

/** PLACEHOLDER — no `AuditLog` model, table, or endpoint exists anywhere in the backend (alembic/versions is empty — there are no migrations at all). See docs/frontend/ADMIN_APP.md. */
export async function listAuditLog(): Promise<AuditLogEntry[]> {
  await delay();
  return MOCK_AUDIT_LOG;
}
