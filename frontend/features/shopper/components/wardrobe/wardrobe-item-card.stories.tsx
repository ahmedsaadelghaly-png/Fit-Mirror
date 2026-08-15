import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { WardrobeItemCard } from "@/features/shopper/components/wardrobe/wardrobe-item-card";

/**
 * WardrobeItemCard calls useDeleteWardrobeItem() (a TanStack Query
 * mutation) internally, which needs a QueryClientProvider ancestor — this
 * decorator supplies one, matching the pattern used for LoginForm's
 * QueryClientProvider wrapper in tests/unit/features/login-form.test.tsx.
 * The delete action is now a ProductCard `actions`-slot icon button,
 * hover/focus-revealed rather than always-visible text — clicking it here
 * will attempt a real network call and fail (there's no backend in
 * Storybook), which is expected — the story exists to document the
 * card's visual states, not to exercise the mutation.
 */
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const meta: Meta<typeof WardrobeItemCard> = {
  title: "Shopper/WardrobeItemCard",
  component: WardrobeItemCard,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="w-64">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof WardrobeItemCard>;

export const Uploaded: Story = {
  args: {
    item: {
      id: "11111111-1111-1111-1111-111111111111",
      source: "uploaded",
      category: "outerwear",
      label: "Blue denim jacket",
      image_key: "wardrobe/a.png",
    },
  },
};

export const CatalogNoLabel: Story = {
  args: {
    item: {
      id: "22222222-2222-2222-2222-222222222222",
      source: "catalog",
      category: "footwear",
      label: null,
      image_key: "wardrobe/b.png",
    },
  },
};
