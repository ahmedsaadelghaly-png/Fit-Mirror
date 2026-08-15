import type { Meta, StoryObj } from "@storybook/react-vite";

import { LoadingState } from "@/components/ui/loading-state";

const meta: Meta<typeof LoadingState> = {
  title: "UI/LoadingState",
  component: LoadingState,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof LoadingState>;

export const Default: Story = {};

export const CustomLabel: Story = {
  args: { label: "Generating your try-on…" },
};
