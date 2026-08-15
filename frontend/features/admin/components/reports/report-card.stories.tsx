import type { Meta, StoryObj } from "@storybook/react-vite";

import { ReportCard } from "@/features/admin/components/reports/report-card";

const meta: Meta<typeof ReportCard> = {
  title: "Admin/ReportCard",
  component: ReportCard,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof ReportCard>;

export const UserGrowth: Story = {
  args: {
    title: "User growth",
    description: "New accounts per month",
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

export const FailedJobs: Story = {
  args: {
    title: "Failed jobs",
    description: "Try-on jobs that failed per month",
    points: [
      { label: "Feb", value: 1 },
      { label: "Mar", value: 3 },
      { label: "Apr", value: 2 },
      { label: "May", value: 5 },
      { label: "Jun", value: 4 },
      { label: "Jul", value: 5 },
    ],
  },
};
