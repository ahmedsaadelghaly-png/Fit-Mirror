import type { Meta, StoryObj } from "@storybook/react-vite";

import { MockedBadge } from "@/features/admin/components/mocked-badge";

const meta: Meta<typeof MockedBadge> = {
  title: "Admin/MockedBadge",
  component: MockedBadge,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof MockedBadge>;

export const Default: Story = {};

export const CustomLabel: Story = {
  args: { label: "Persisted locally, not synced to a backend" },
};
