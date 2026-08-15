import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/shared/components/cards/product-card";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const meta: Meta<typeof ProductCard> = {
  title: "Shared/ProductCard",
  component: ProductCard,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="w-56">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ProductCard>;

export const Default: Story = {
  args: {
    imageKey: "products/oxford-shirt.png",
    alt: "Oxford shirt",
    name: "Classic Oxford Shirt",
    subtitle: "Everlane",
    price: "$68",
  },
};

export const WithStatusBadge: Story = {
  args: {
    imageKey: "products/wool-coat.png",
    alt: "Wool coat",
    name: "Tailored Wool Coat",
    subtitle: "Studio Nine",
    price: "$310",
    onClick: () => {},
    badge: <Badge variant="warning">Low stock</Badge>,
  },
};

/** Hover/focus reveals the actions slot — e.g. WardrobeItemCard's delete button. */
export const WithHoverActions: Story = {
  args: {
    imageKey: "products/denim-jacket.png",
    alt: "Denim jacket",
    name: "Blue Denim Jacket",
    subtitle: "Uploaded",
    badge: <Badge variant="secondary">Outerwear</Badge>,
    actions: (
      <Button size="icon" variant="secondary" className="size-8 rounded-full" aria-label="Delete">
        <Trash2 className="size-3.5" />
      </Button>
    ),
  },
};
