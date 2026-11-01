import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadDownloadUrl } from "@/api/storage";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock("@/api/client", () => ({ apiClient: { post: postMock, get: vi.fn() } }));

function urlsFor(keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, `https://bucket.test/${key}`]));
}

beforeEach(() => {
  postMock.mockReset();
  postMock.mockImplementation(async (_url: string, body: { object_keys: string[] }) => ({
    data: { download_urls: urlsFor(body.object_keys) },
  }));
});

describe("loadDownloadUrl", () => {
  it("batches keys requested together into one request, deduplicated", async () => {
    const urls = await Promise.all([
      loadDownloadUrl("a.jpg"),
      loadDownloadUrl("b.jpg"),
      loadDownloadUrl("a.jpg"),
    ]);

    expect(urls).toEqual([
      "https://bucket.test/a.jpg",
      "https://bucket.test/b.jpg",
      "https://bucket.test/a.jpg",
    ]);
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith("/storage/download-urls", {
      object_keys: ["a.jpg", "b.jpg"],
    });
  });

  it("splits large grids into requests of at most 100 keys", async () => {
    const keys = Array.from({ length: 150 }, (_, index) => `k/${index}.jpg`);
    await Promise.all(keys.map(loadDownloadUrl));

    expect(postMock).toHaveBeenCalledTimes(2);
    expect(postMock.mock.calls[0]?.[1].object_keys).toHaveLength(100);
    expect(postMock.mock.calls[1]?.[1].object_keys).toHaveLength(50);
  });

  it("rejects every waiter in a failed batch", async () => {
    postMock.mockRejectedValueOnce(new Error("network down"));
    const results = await Promise.allSettled([loadDownloadUrl("x.jpg"), loadDownloadUrl("y.jpg")]);
    expect(results.map((result) => result.status)).toEqual(["rejected", "rejected"]);
  });
});
