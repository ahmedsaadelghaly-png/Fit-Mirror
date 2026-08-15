import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    type: { control: "select", options: ["text", "email", "password", "number"] },
  },
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: "you@example.com", type: "email" },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-1.5">
      <Label htmlFor="story-email">Email</Label>
      <Input id="story-email" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-1.5">
      <Label htmlFor="story-email-invalid">Email</Label>
      <Input id="story-email-invalid" type="email" defaultValue="not-an-email" aria-invalid />
      <p className="text-sm text-destructive">Enter a valid email address</p>
    </div>
  ),
};

export const Disabled: Story = {
  args: { placeholder: "Can't type here", disabled: true },
};
