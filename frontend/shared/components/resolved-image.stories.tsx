import type { Meta, StoryObj } from "@storybook/react-vite";

import { ResolvedImage } from "@/shared/components/resolved-image";

const meta: Meta<typeof ResolvedImage> = {
  title: "Shopper/ResolvedImage",
  component: ResolvedImage,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="size-40">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ResolvedImage>;

/**
 * `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` isn't configured (see
 * shared/utils/resolve-image-url.ts), so this falls through to
 * `hooks/use-resolved-image-url.ts`'s `GET /tryon/download-url` call —
 * which has nothing to talk to under Storybook's standalone Vite server,
 * so the query errors out and this renders the placeholder, same as the
 * synchronous "unresolvable" case did before that hook existed.
 */
export const UnresolvableKey: Story = {
  args: { imageKey: "wardrobe/some-object-key.png", alt: "Blue denim jacket" },
};

export const NoKey: Story = {
  args: { imageKey: null, alt: "No image yet" },
};
