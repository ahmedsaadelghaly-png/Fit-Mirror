import type { Meta, StoryObj } from "@storybook/react-vite";

import { StoreSummaryCard } from "@/features/brand/components/dashboard/store-summary-card";

const meta: Meta<typeof StoreSummaryCard> = {
  title: "Brand/StoreSummaryCard",
  component: StoreSummaryCard,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof StoreSummaryCard>;

export const Verified: Story = {
  args: {
    store: {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Demo Fashion Co.",
      slug: "demo-fashion-co",
      logo_image_key: null,
      category: null,
      description: null,
      social_links: { website: null, instagram: null, tiktok: null },
      is_verified: true,
    },
  },
};

export const PendingVerification: Story = {
  args: {
    store: {
      id: "22222222-2222-2222-2222-222222222222",
      name: "New Threads Boutique",
      slug: "new-threads-boutique",
      logo_image_key: null,
      category: null,
      description: null,
      social_links: { website: null, instagram: null, tiktok: null },
      is_verified: false,
    },
  },
};
