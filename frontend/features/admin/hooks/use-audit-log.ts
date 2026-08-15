import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listAuditLog } from "@/api/admin/audit-log";
import type { AuditLogFilters } from "@/types/admin";

const DEFAULT_FILTERS: AuditLogFilters = { eventType: "all", search: "" };

export function useAuditLog() {
  const [filters, setFilters] = useState<AuditLogFilters>(DEFAULT_FILTERS);

  const query = useQuery({ queryKey: ["admin", "audit-log"], queryFn: listAuditLog });
  const entries = useMemo(() => query.data ?? [], [query.data]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (filters.eventType !== "all" && entry.event_type !== filters.eventType) return false;
      if (filters.search) {
        const haystack = `${entry.actor_email} ${entry.target} ${entry.event_type}`.toLowerCase();
        if (!haystack.includes(filters.search.toLowerCase())) return false;
      }
      return true;
    });
  }, [entries, filters]);

  return { ...query, entries, filteredEntries, filters, setFilters };
}
