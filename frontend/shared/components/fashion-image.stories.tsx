import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  EditorialImage,
  FashionImage,
  ModelImage,
  ProductImage,
} from "@/shared/components/fashion-image";

const meta: Meta<typeof FashionImage> = {
  title: "Shared/FashionImage",
  component: FashionImage,
  tags: ["autodocs"],
  argTypes: {
    aspect: {
      control: "select",
      options: ["square", "portrait", "landscape", "wide", "editorial"],
    },
  },
};
export default meta;

type Story = StoryObj<typeof FashionImage>;

/**
 * No `src` — the tasteful abstract placeholder every asset slot falls
 * back to until real photography is dropped in (see docs/frontend/ASSETS.md).
 */
export const Placeholder: Story = {
  args: { alt: "Editorial hero photography" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const AllAspects: Story = {
  render: () => (
    <div className="grid w-full max-w-3xl grid-cols-2 gap-4">
      <div>
        <p className="mb-2 text-xs text-muted-foreground">square (ProductImage)</p>
        <ProductImage alt="Product placeholder" />
      </div>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">portrait (ModelImage)</p>
        <ModelImage alt="Model placeholder" />
      </div>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">editorial (EditorialImage)</p>
        <EditorialImage alt="Editorial placeholder" />
      </div>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">wide</p>
        <FashionImage alt="Wide placeholder" aspect="wide" />
      </div>
    </div>
  ),
};
