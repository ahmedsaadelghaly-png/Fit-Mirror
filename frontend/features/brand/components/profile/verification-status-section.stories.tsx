import type { Meta, StoryObj } from "@storybook/react-vite";

import { VerificationStatusSection } from "@/features/brand/components/profile/verification-status-section";

const meta: Meta<typeof VerificationStatusSection> = {
  title: "Brand/VerificationStatusSection",
  component: VerificationStatusSection,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof VerificationStatusSection>;

export const Verified: Story = { args: { isVerified: true } };
export const Pending: Story = { args: { isVerified: false } };
