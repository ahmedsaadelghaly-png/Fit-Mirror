import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "@/components/ui/input";
import { AiChatPanel, SuggestedPrompts } from "@/features/shopper/components/ai-chat-panel";

const meta: Meta<typeof AiChatPanel> = {
  title: "Shopper/AiChatPanel",
  component: AiChatPanel,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AiChatPanel>;

export const Empty: Story = {
  args: {
    messages: [],
    isPending: false,
    emptyStateText: 'Ask something like "What should I wear to a summer wedding?"',
  },
  render: (args) => (
    <AiChatPanel {...args}>
      <Input placeholder="Occasion (e.g. wedding, work)" />
    </AiChatPanel>
  ),
};

export const WithConversation: Story = {
  args: {
    messages: [
      { id: "1", role: "user", content: "Wedding guest · Warm" },
      {
        id: "2",
        role: "assistant",
        content: "A linen suit in a light neutral would work well for a warm-weather wedding.",
      },
    ],
    isPending: false,
    emptyStateText: "",
  },
  render: (args) => (
    <AiChatPanel {...args}>
      <SuggestedPrompts prompts={["Wedding guest", "Job interview"]} onSelect={() => {}} />
      <Input placeholder="Occasion (e.g. wedding, work)" />
    </AiChatPanel>
  ),
};

export const Pending: Story = {
  args: {
    messages: [{ id: "1", role: "user", content: "Date night" }],
    isPending: true,
    emptyStateText: "",
  },
  render: (args) => (
    <AiChatPanel {...args}>
      <Input placeholder="Occasion (e.g. wedding, work)" />
    </AiChatPanel>
  ),
};
