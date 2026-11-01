import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResolvedImage } from "@/shared/components/resolved-image";

vi.mock("@/hooks/use-resolved-image-url", () => ({
  useResolvedImageUrl: (key: string | null) => ({
    data: key ? { download_url: `https://bucket.test/${key}` } : undefined,
  }),
}));

describe("ResolvedImage", () => {
  it("renders the resolved image", () => {
    render(<ResolvedImage imageKey="looks/a.png" alt="A look" />);
    expect(screen.getByRole("img", { name: "A look" })).toHaveAttribute(
      "src",
      "https://bucket.test/looks/a.png",
    );
  });

  it("falls back to the placeholder tile when the image fails to load", () => {
    render(<ResolvedImage imageKey="missing.png" alt="Try-on job" />);

    fireEvent.error(screen.getByRole("img", { name: "Try-on job" }));

    const placeholder = screen.getByRole("img", { name: "Try-on job" });
    expect(placeholder.tagName).toBe("DIV");
    expect(placeholder).not.toHaveAttribute("src");
  });

  it("tries again when the tile gets a different image", () => {
    const { rerender } = render(<ResolvedImage imageKey="missing.png" alt="Look" />);
    fireEvent.error(screen.getByRole("img", { name: "Look" }));

    rerender(<ResolvedImage imageKey="looks/b.png" alt="Look" />);

    expect(screen.getByRole("img", { name: "Look" }).tagName).toBe("IMG");
  });
});
