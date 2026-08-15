import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "@/components/ui/badge";
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
