import type { Meta, StoryObj } from "@storybook/react-vite";

import { QueueStatusCard } from "@/features/tryon/components/queue-status-card";
import type { TryOnJob } from "@/types/domain";

const meta: Meta<typeof QueueStatusCard> = {
  title: "Tryon/QueueStatusCard",
  component: QueueStatusCard,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof QueueStatusCard>;

function job(overrides: Partial<TryOnJob>): TryOnJob {
  return {
    id: crypto.randomUUID(),
    status: "pending",
    user_image_key: "user-photos/a.png",
    garment_image_key: "wardrobe/b.png",
    result_image_key: null,
    ai_model_name: null,
    error_message: null,
    ...overrides,
  };
}

export const Empty: Story = {
  args: { activeJobs: [] },
};

export const WithActiveJobs: Story = {
  args: {
    activeJobs: [job({ status: "pending" }), job({ status: "processing" })],
  },
};
