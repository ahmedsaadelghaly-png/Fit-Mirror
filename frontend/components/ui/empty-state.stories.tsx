import type { Meta, StoryObj } from "@storybook/react-vite";
import { Shirt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    icon: Shirt,
    title: "Your wardrobe is empty",
    description: "Add pieces you own to start building outfits and trying things on.",
  },
};

export const WithAction: Story = {
  render: () => (
    <EmptyState
      icon={Shirt}
      title="Your wardrobe is empty"
      description="Add pieces you own to start building outfits and trying things on."
      action={<Button size="sm">Add your first item</Button>}
    />
  ),
};

export const WithoutIcon: Story = {
  args: {
    title: "No results",
    description: "Try adjusting your search or filters.",
  },
};
