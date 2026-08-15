import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "flush", "media", "elevated"],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Virtual Try-On</CardTitle>
        <CardDescription>See a garment on you, before you buy it.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Upload a photo and a garment image to generate a try-on preview.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Start a try-on</Button>
      </CardFooter>
    </Card>
  ),
};

export const HeaderOnly: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Products</CardTitle>
        <CardDescription>3 active products in your catalog</CardDescription>
      </CardHeader>
    </Card>
  ),
};

/** No border/shadow/fill — editorial copy blocks that sit directly on the page. */
export const Flush: Story = {
  render: () => (
    <Card variant="flush" className="w-80">
      <CardHeader className="px-0">
        <CardTitle>For Fashion Brands</CardTitle>
        <CardDescription>Manage your catalog and see how it performs in try-on.</CardDescription>
      </CardHeader>
    </Card>
  ),
};

/** Image-forward: crisp corners, hairline border, no baked-in padding. */
export const Media: Story = {
  render: () => (
    <Card variant="media" className="w-64">
      <div className="aspect-[3/4] bg-gradient-to-br from-foreground to-muted-foreground/40" />
      <CardContent className="p-3">
        <p className="text-sm font-medium">Evening Look</p>
      </CardContent>
    </Card>
  ),
};

/** Slightly more lift than `default` — floating panels, featured callouts. */
export const Elevated: Story = {
  render: () => (
    <Card variant="elevated" className="w-80">
      <CardHeader>
        <CardTitle>Featured</CardTitle>
        <CardDescription>A card that should stand apart from the page.</CardDescription>
      </CardHeader>
    </Card>
  ),
};
