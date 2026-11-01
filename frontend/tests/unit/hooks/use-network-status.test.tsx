import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OfflineBanner } from "@/shared/components/offline-banner";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useNetworkStatus / OfflineBanner", () => {
  it("never renders the banner during SSR, even when navigator.onLine is missing", () => {
    // Node 21+ has a global `navigator` without `onLine` — the bug that put
    // the offline banner into every server-rendered page.
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(undefined as unknown as boolean);

    expect(renderToString(<OfflineBanner />)).toBe("");
  });

  it("shows the banner when the browser goes offline and hides it when back online", () => {
    const onLine = vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    render(<OfflineBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    onLine.mockReturnValue(false);
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByRole("status")).toHaveTextContent(/you're offline/i);

    onLine.mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
