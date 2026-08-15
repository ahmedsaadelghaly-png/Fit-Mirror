import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProductStatusBadge } from "@/features/brand/components/products/product-status-badge";

const meta: Meta<typeof ProductStatusBadge> = {
  title: "Brand/ProductStatusBadge",
  component: ProductStatusBadge,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof ProductStatusBadge>;

export const Active: Story = { args: { isActive: true, isArchived: false } };
export const Inactive: Story = { args: { isActive: false, isArchived: false } };
export const Archived: Story = { args: { isActive: true, isArchived: true } };
