import type { Meta, StoryObj } from "@storybook/react-vite";

import { WorkerStatusCard } from "@/features/admin/components/queue/worker-status-card";

const meta: Meta<typeof WorkerStatusCard> = {
  title: "Admin/WorkerStatusCard",
  component: WorkerStatusCard,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof WorkerStatusCard>;

export const Online: Story = {
  args: {
    worker: {
      id: "w-1",
      hostname: "worker-1.internal",
      state: "online",
      activeTasks: 2,
      concurrency: 4,
      lastHeartbeatAt: "2026-07-08T09:14:00Z",
    },
  },
};

export const Degraded: Story = {
  args: {
    worker: {
      id: "w-3",
      hostname: "worker-3.internal",
      state: "degraded",
      activeTasks: 0,
      concurrency: 4,
      lastHeartbeatAt: "2026-07-08T09:05:00Z",
    },
  },
};

export const Offline: Story = {
  args: {
    worker: {
      id: "w-4",
      hostname: "worker-4.internal",
      state: "offline",
      activeTasks: 0,
      concurrency: 4,
      lastHeartbeatAt: "2026-07-08T08:00:00Z",
    },
  },
};
