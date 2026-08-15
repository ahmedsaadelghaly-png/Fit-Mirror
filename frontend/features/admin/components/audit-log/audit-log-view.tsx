"use client";

import { Download, ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { MockedBadge } from "@/features/admin/components/mocked-badge";
import { useAuditLog } from "@/features/admin/hooks/use-audit-log";
import { exportRowsToCsv } from "@/shared/utils/export-csv";
import type { AuditEventType } from "@/types/admin";

const EVENT_TYPES: AuditEventType[] = [
  "user.login",
  "user.role_changed",
  "user.deactivated",
  "store.verified",
  "store.suspended",
  "product.flagged",
  "tryon.job_failed",
  "feature_flag.toggled",
];

function AuditLogView() {
  return (
    <AdminGuard>
      <AuditLogContent />
    </AdminGuard>
  );
}

function AuditLogContent() {
  const { isLoading, isError, refetch, entries, filteredEntries, filters, setFilters } =
    useAuditLog();

  const handleExport = () => {
    exportRowsToCsv(
      "audit-log.csv",
      filteredEntries.map((entry) => ({
        ...entry,
        metadata: JSON.stringify(entry.metadata),
      })),
      [
        { key: "timestamp", header: "Timestamp" },
        { key: "event_type", header: "Event type" },
        { key: "actor_email", header: "Actor" },
        { key: "target", header: "Target" },
        { key: "metadata", header: "Metadata" },
      ],
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Audit logs</h1>
          <p className="text-sm text-muted-foreground">Every recorded admin and system action.</p>
        </div>
        <div className="flex items-center gap-2">
          <MockedBadge />
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredEntries.length === 0}
          >
            <Download className="size-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState
          description="We couldn't load the audit log. Please try again."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && entries.length === 0 && (
        <EmptyState icon={ScrollText} title="No audit events recorded yet" />
      )}

      {!isLoading && !isError && entries.length > 0 && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="audit-search">Search</Label>
              <Input
                id="audit-search"
                placeholder="Search by actor or target"
                className="w-64"
                value={filters.search}
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="audit-event-type">Event type</Label>
              <Select
                value={filters.eventType}
                onValueChange={(value) =>
                  setFilters({ ...filters, eventType: value as AuditEventType | "all" })
                }
              >
                <SelectTrigger id="audit-event-type" className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All event types</SelectItem>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <EmptyState title="No events match your filters" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event type</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{entry.event_type}</TableCell>
                    <TableCell className="text-sm">{entry.actor_email}</TableCell>
                    <TableCell className="text-sm">{entry.target}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {Object.keys(entry.metadata).length > 0
                        ? JSON.stringify(entry.metadata)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}

export { AuditLogView };
