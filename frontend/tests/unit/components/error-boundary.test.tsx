import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "@/components/error-boundary";

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("boom");
  return <div>Safe content</div>;
}

describe("ErrorBoundary", () => {
  // React logs the caught error to console.error even when a boundary
  // handles it — expected noise for these tests, not a real failure.
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when nothing throws", () => {
    render(
      <ErrorBoundary context="test">
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Safe content")).toBeInTheDocument();
  });

  it("renders the default ErrorState fallback when a child throws", () => {
    render(
      <ErrorBoundary context="test">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders a custom fallback when one is provided", () => {
    render(
      <ErrorBoundary context="test" fallback={(error) => <div>Custom: {error.message}</div>}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Custom: boom")).toBeInTheDocument();
  });

  it("reset() lets the boundary retry rendering its children", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [shouldThrow, setShouldThrow] = useState(true);
      return (
        <ErrorBoundary
          context="test"
          fallback={(_error, reset) => (
            <button
              onClick={() => {
                setShouldThrow(false);
                reset();
              }}
            >
              Try again
            </button>
          )}
        >
          <Bomb shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Safe content")).toBeInTheDocument();
  });
});
