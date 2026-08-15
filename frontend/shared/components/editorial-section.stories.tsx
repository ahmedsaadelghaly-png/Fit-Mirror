import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/ui/button";
import { FashionSection } from "@/shared/components/editorial-section";
import { EditorialImage } from "@/shared/components/fashion-image";

const meta: Meta<typeof FashionSection> = {
  title: "Shared/FashionSection",
  component: FashionSection,
  tags: ["autodocs"],
  argTypes: {
    align: { control: "select", options: ["left", "center"] },
    tone: { control: "select", options: ["default", "dark"] },
  },
};
export default meta;

type Story = StoryObj<typeof FashionSection>;

export const Default: Story = {
  args: {
    eyebrow: "Digital Wardrobe",
    heading: "Every piece you own, organized and ready to style.",
    description: "Your closet, mapped — tops, bottoms, outerwear, and everything between.",
    align: "left",
  },
  render: (args) => (
    <FashionSection {...args}>
      <div className="grid grid-cols-3 gap-4">
        <EditorialImage alt="Wardrobe placeholder" />
        <EditorialImage alt="Wardrobe placeholder" />
        <EditorialImage alt="Wardrobe placeholder" />
      </div>
    </FashionSection>
  ),
};

export const CenteredWithActions: Story = {
  args: {
    eyebrow: "Get started",
    heading: "See it on, before it's yours.",
    description: "Create an account to start trying on garments virtually.",
    align: "center",
    actions: (
      <>
        <Button size="lg">Create your account</Button>
        <Button size="lg" variant="outline">
          I already have one
        </Button>
      </>
    ),
  },
};

export const DarkTone: Story = {
  args: {
    eyebrow: "For Fashion Brands",
    heading: "Premium commerce software for the brands you love.",
    description: "Manage your catalog, media, and see how it performs in try-on.",
    tone: "dark",
    align: "left",
  },
};
