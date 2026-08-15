import { describe, expect, it } from "vitest";

import { MAX_IMAGE_UPLOAD_BYTES, validateImageFile } from "@/api/shopper/upload";

function makeFile(type: string, sizeBytes: number): File {
  const file = new File([new Uint8Array(sizeBytes)], "photo", { type });
  return file;
}

describe("validateImageFile", () => {
  it("accepts a PNG under the size limit", () => {
    const result = validateImageFile(makeFile("image/png", 1024));
    expect(result.ok).toBe(true);
  });

  it("accepts a JPEG under the size limit", () => {
    const result = validateImageFile(makeFile("image/jpeg", 1024));
    expect(result.ok).toBe(true);
  });

  it("rejects an unsupported mime type", () => {
    const result = validateImageFile(makeFile("application/pdf", 1024));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/png or jpg/i);
  });

  it("rejects a file over the size limit", () => {
    const result = validateImageFile(makeFile("image/png", MAX_IMAGE_UPLOAD_BYTES + 1));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/too large/i);
  });

  it("accepts a file exactly at the size limit", () => {
    const result = validateImageFile(makeFile("image/png", MAX_IMAGE_UPLOAD_BYTES));
    expect(result.ok).toBe(true);
  });
});
