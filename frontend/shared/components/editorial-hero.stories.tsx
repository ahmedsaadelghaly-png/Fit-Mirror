import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/ui/button";
import { EditorialHero } from "@/shared/components/editorial-hero";
import { EditorialImage } from "@/shared/components/fashion-image";

const meta: Meta<typeof EditorialHero> = {
  title: "Shared/EditorialHero",
  component: EditorialHero,
  tags: ["autodocs"],
  argTypes: {
    tone: { control: "select", options: ["default", "dark"] },
    reverse: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<typeof EditorialHero>;

export const Default: Story = {
  args: {
    eyebrow: "AI-powered fashion, done properly",
    heading: (
      <>
        See it on, <span className="text-primary">before it&apos;s yours</span>.
      </>
    ),
    description:
      "FitMirror AI combines virtual try-on, a wardrobe that knows your fit, and a stylist that never sleeps.",
    actions: (
      <>
        <Button size="xl">Create your account</Button>
        <Button size="xl" variant="outline">
          I already have one
        </Button>
      </>
    ),
    media: <EditorialImage alt="Model wearing a try-on result" />,
  },
};

export const Reversed: Story = {
  args: {
    ...Default.args,
    heading: "Premium commerce software for fashion brands.",
    description: "Manage your catalog, media, and see how it performs in try-on.",
    reverse: true,
  },
};

export const DarkTone: Story = {
  args: {
    ...Default.args,
    tone: "dark",
  },
};
