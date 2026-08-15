import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LookCard } from "@/shared/components/cards/look-card";

/**
 * LookCard resolves `imageKey` via ResolvedImage's useResolvedImageUrl
 * query — needs a QueryClientProvider ancestor, same pattern as
 * WardrobeItemCard's story. No public bucket is configured under
 * Storybook, so every key here falls through to the placeholder tile,
 * which is the state these stories document.
 */
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const meta: Meta<typeof LookCard> = {
  title: "Shared/LookCard",
  component: LookCard,
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

type Story = StoryObj<typeof LookCard>;

export const Default: Story = {
  args: {
    imageKey: "looks/evening-out.png",
    alt: "Evening out look",
    title: "Evening Out",
    meta: "Saved 3 days ago",
  },
};

export const WithBadgeAndActions: Story = {
  args: {
    imageKey: "looks/weekend.png",
    alt: "Weekend look",
    title: "Weekend Brunch",
    meta: "4 pieces",
    onClick: () => {},
    badge: (
      <span className="rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground">
        New
      </span>
    ),
    actions: (
      <Button size="icon" variant="secondary" className="size-8 rounded-full" aria-label="Favorite">
        <Heart className="size-4" />
      </Button>
    ),
  },
};

export const NoCaption: Story = {
  args: {
    imageKey: "looks/untitled.png",
    alt: "Untitled saved look",
  },
};
