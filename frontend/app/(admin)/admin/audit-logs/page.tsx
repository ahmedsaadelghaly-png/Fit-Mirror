import type { Metadata } from "next";

import { AuditLogView } from "@/features/admin/components/audit-log/audit-log-view";

export const metadata: Metadata = { title: "Audit logs" };

export default function AdminAuditLogsPage() {
  return <AuditLogView />;
}
