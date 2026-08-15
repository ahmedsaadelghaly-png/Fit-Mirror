import type { Meta, StoryObj } from "@storybook/react-vite";

import { StatusChip } from "@/components/ui/status-chip";

const meta: Meta<typeof StatusChip> = {
  title: "UI/StatusChip",
  component: StatusChip,
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["pending", "processing", "completed", "failed"],
    },
  },
};
export default meta;

type Story = StoryObj<typeof StatusChip>;

export const Default: Story = {
  args: { status: "pending" },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusChip status="pending" />
      <StatusChip status="processing" />
      <StatusChip status="completed" />
      <StatusChip status="failed" />
    </div>
  ),
};
