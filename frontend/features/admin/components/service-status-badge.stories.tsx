import type { Meta, StoryObj } from "@storybook/react-vite";

import { ServiceStatusBadge } from "@/features/admin/components/service-status-badge";

const meta: Meta<typeof ServiceStatusBadge> = {
  title: "Admin/ServiceStatusBadge",
  component: ServiceStatusBadge,
  tags: ["autodocs"],
  argTypes: {
    status: { control: "select", options: ["healthy", "degraded", "down", "unknown"] },
  },
};
export default meta;

type Story = StoryObj<typeof ServiceStatusBadge>;

export const Healthy: Story = { args: { status: "healthy" } };
export const Degraded: Story = { args: { status: "degraded" } };
export const Down: Story = { args: { status: "down" } };
export const Unknown: Story = { args: { status: "unknown" } };
