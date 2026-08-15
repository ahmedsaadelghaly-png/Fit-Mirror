"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRetryTryOnJob } from "@/features/admin/hooks/use-retry-tryon-job";
import type { AdminTryOnJobRow } from "@/types/admin";

export interface AdminTryOnJobsTableProps {
  jobs: AdminTryOnJobRow[];
  getRetryOverlay: (jobId: string) => { retryRequestedAt: string } | null;
}

/** "Retry" has no backend endpoint for an admin to resubmit another user's job — see api/admin/tryon-jobs.ts. */
function AdminTryOnJobsTable({ jobs, getRetryOverlay }: AdminTryOnJobsTableProps) {
  const retryMutation = useRetryTryOnJob();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Store</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-32" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => {
          const retryOverlay = getRetryOverlay(job.id);
          return (
            <TableRow key={job.id}>
              <TableCell>
                <Link
                  href={`/admin/tryon-jobs/${job.id}`}
                  className="font-mono text-xs hover:underline"
                >
                  {job.id}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{job.user_email}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{job.store_name}</TableCell>
              <TableCell>
                <StatusChip status={job.status} />
              </TableCell>
              <TableCell>
                {job.status === "failed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => retryMutation.mutate(job.id)}
                    isLoading={retryMutation.isPending}
                    disabled={!!retryOverlay}
                  >
                    <RotateCcw className="size-3.5" /> {retryOverlay ? "Requested" : "Retry"}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export { AdminTryOnJobsTable };
