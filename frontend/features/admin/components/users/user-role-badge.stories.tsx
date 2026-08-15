import type { Meta, StoryObj } from "@storybook/react-vite";

import { UserRoleBadge } from "@/features/admin/components/users/user-role-badge";

const meta: Meta<typeof UserRoleBadge> = {
  title: "Admin/UserRoleBadge",
  component: UserRoleBadge,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof UserRoleBadge>;

export const Shopper: Story = { args: { role: "shopper" } };
export const BrandAdmin: Story = { args: { role: "brand_admin" } };
export const PlatformAdmin: Story = { args: { role: "platform_admin" } };
