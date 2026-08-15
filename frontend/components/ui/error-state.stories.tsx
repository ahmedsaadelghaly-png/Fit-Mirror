import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { ErrorState } from "@/components/ui/error-state";

const meta: Meta<typeof ErrorState> = {
  title: "UI/ErrorState",
  component: ErrorState,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof ErrorState>;

export const Default: Story = {};

export const CustomMessage: Story = {
  args: {
    title: "Couldn't load your wardrobe",
    description: "We ran into a problem fetching your wardrobe items.",
  },
};

export const WithRetry: Story = {
  args: {
    onRetry: fn(),
  },
};
