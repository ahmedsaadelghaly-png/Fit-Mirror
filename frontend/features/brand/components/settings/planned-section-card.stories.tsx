import { CreditCard, Plug, Users } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { PlannedSectionCard } from "@/features/brand/components/settings/planned-section-card";

const meta: Meta<typeof PlannedSectionCard> = {
  title: "Brand/PlannedSectionCard",
  component: PlannedSectionCard,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof PlannedSectionCard>;

export const Billing: Story = {
  args: {
    icon: CreditCard,
    title: "Billing",
    description: "Subscription plan, payment method, and invoices.",
    emptyStateTitle: "No billing information yet",
  },
};

export const TeamManagement: Story = {
  args: {
    icon: Users,
    title: "Team management",
    description: "Invite teammates to help manage your store.",
    emptyStateTitle: "No team members yet",
  },
};

export const ApiIntegration: Story = {
  args: {
    icon: Plug,
    title: "API integration",
    description: "API keys and webhooks for connecting external tools.",
    emptyStateTitle: "No API keys yet",
  },
};
