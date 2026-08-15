import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { SavedLookCard } from "@/features/shopper/components/saved-looks/saved-look-card";

const meta: Meta<typeof SavedLookCard> = {
  title: "Shopper/SavedLookCard",
  component: SavedLookCard,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-48">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof SavedLookCard>;

export const Default: Story = {
  args: {
    look: {
      id: "11111111-1111-1111-1111-111111111111",
      tryon_job_id: "22222222-2222-2222-2222-222222222222",
      result_image_key: "results/a.png",
      garment_image_key: "wardrobe/b.png",
      label: "Weekend brunch look",
      created_at: new Date().toISOString(),
    },
    onOpen: fn(),
  },
};

export const UnlabeledLook: Story = {
  args: {
    look: {
      id: "33333333-3333-3333-3333-333333333333",
      tryon_job_id: "44444444-4444-4444-4444-444444444444",
      result_image_key: "results/c.png",
      garment_image_key: "wardrobe/d.png",
      label: null,
      created_at: new Date().toISOString(),
    },
    onOpen: fn(),
  },
};
