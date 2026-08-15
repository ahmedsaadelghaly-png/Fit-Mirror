import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { ImageUploadField } from "@/shared/components/image-upload-field";

const meta: Meta<typeof ImageUploadField> = {
  title: "Shopper/ImageUploadField",
  component: ImageUploadField,
  tags: ["autodocs"],
  args: {
    label: "Drop a photo here, or click to browse",
    hint: "PNG or JPG, up to 10MB",
    onFileSelected: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof ImageUploadField>;

export const Idle: Story = {
  args: { status: "idle", previewUrl: null, progress: 0, error: null },
};

export const Uploading: Story = {
  args: {
    status: "uploading",
    previewUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjY2IiB2aWV3Qm94PSIwIDAgMjAwIDI2NiI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyNjYiIGZpbGw9IiNkMWQ1ZGIiLz48L3N2Zz4=",
    progress: 55,
    error: null,
    onClear: fn(),
  },
};

export const Success: Story = {
  args: {
    status: "success",
    previewUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjY2IiB2aWV3Qm94PSIwIDAgMjAwIDI2NiI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyNjYiIGZpbGw9IiNkMWQ1ZGIiLz48L3N2Zz4=",
    progress: 100,
    error: null,
    onClear: fn(),
  },
};

export const Error: Story = {
  args: {
    status: "error",
    previewUrl: null,
    progress: 0,
    error: "Upload failed. Please try again.",
  },
};
