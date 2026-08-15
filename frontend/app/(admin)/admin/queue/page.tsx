import type { Metadata } from "next";

import { QueueView } from "@/features/admin/components/queue/queue-view";

export const metadata: Metadata = { title: "Queue & workers" };

export default function AdminQueuePage() {
  return <QueueView />;
}
