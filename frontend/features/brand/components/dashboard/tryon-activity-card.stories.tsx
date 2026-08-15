import type { Meta, StoryObj } from "@storybook/react-vite";

import { TryOnActivityCard } from "@/features/brand/components/dashboard/tryon-activity-card";

const meta: Meta<typeof TryOnActivityCard> = {
  title: "Brand/TryOnActivityCard",
  component: TryOnActivityCard,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof TryOnActivityCard>;

export const NoActivity: Story = {
  args: { tryOnJobCount: 0, completedTryOnCount: 0, failedTryOnCount: 0 },
};

export const WithActivity: Story = {
  args: { tryOnJobCount: 12, completedTryOnCount: 10, failedTryOnCount: 1 },
};
