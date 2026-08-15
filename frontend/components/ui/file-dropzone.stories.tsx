import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { FileDropzone } from "@/components/ui/file-dropzone";

const meta: Meta<typeof FileDropzone> = {
  title: "UI/FileDropzone",
  component: FileDropzone,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof FileDropzone>;

export const Default: Story = {
  args: {
    onFilesSelected: fn(),
  },
};

export const CustomCopy: Story = {
  args: {
    label: "Drop your photo here, or click to browse",
    hint: "For best results, use a well-lit, front-facing photo",
    onFilesSelected: fn(),
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};
