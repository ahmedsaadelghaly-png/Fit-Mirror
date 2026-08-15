import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: "Continue" },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};

export const Loading: Story = {
  args: { children: "Saving", isLoading: true },
};

export const Disabled: Story = {
  args: { children: "Can't click me", disabled: true },
};

export const IconOnly: Story = {
  args: {
    size: "icon",
    "aria-label": "Like",
    children: <Heart />,
  },
};

export const AsChildLink: Story = {
  name: "asChild (renders as <a>)",
  render: () => (
    <Button asChild>
      <a href="#storybook">I&apos;m a real link styled as a button</a>
    </Button>
  ),
};
