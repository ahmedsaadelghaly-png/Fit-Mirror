import type { Meta, StoryObj } from "@storybook/react-vite";

import { MiniBarChart } from "@/features/admin/components/reports/mini-bar-chart";

const meta: Meta<typeof MiniBarChart> = {
  title: "Admin/MiniBarChart",
  component: MiniBarChart,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof MiniBarChart>;

export const Growing: Story = {
  args: {
    points: [
      { label: "Feb", value: 4 },
      { label: "Mar", value: 9 },
      { label: "Apr", value: 14 },
      { label: "May", value: 22 },
      { label: "Jun", value: 31 },
      { label: "Jul", value: 38 },
    ],
  },
};

export const Flat: Story = {
  args: {
    points: [
      { label: "Feb", value: 5 },
      { label: "Mar", value: 5 },
      { label: "Apr", value: 5 },
    ],
  },
};
