import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { TryOnJobCard } from "@/features/tryon/components/tryon-job-card";
import type { TryOnJob } from "@/types/domain";

const meta: Meta<typeof TryOnJobCard> = {
  title: "Tryon/TryOnJobCard",
  component: TryOnJobCard,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof TryOnJobCard>;

const baseJob: TryOnJob = {
  id: "11111111-1111-1111-1111-111111111111",
  status: "pending",
  user_image_key: "user-photos/a.png",
  garment_image_key: "wardrobe/b.png",
  result_image_key: null,
  ai_model_name: null,
  error_message: null,
  created_at: "2026-11-01T10:00:00Z",
  product_variant_id: null,
  product_title: null,
  size_label: null,
};

export const Pending: Story = {
  args: { job: { ...baseJob, status: "pending" }, onSelect: fn() },
};

export const Processing: Story = {
  args: { job: { ...baseJob, status: "processing" }, onSelect: fn() },
};

export const Completed: Story = {
  args: {
    job: { ...baseJob, status: "completed", result_image_key: "results/c.png" },
    onSelect: fn(),
  },
};

export const Failed: Story = {
  args: {
    job: {
      ...baseJob,
      status: "failed",
      error_message: "The AI service could not process this image.",
    },
    onSelect: fn(),
    onRetry: fn(),
  },
};
