import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusChip } from "@/components/ui/status-chip";

describe("StatusChip", () => {
  it.each([
    ["pending", "Pending"],
    ["processing", "Processing"],
    ["completed", "Completed"],
    ["failed", "Failed"],
  ] as const)("renders the correct label for status=%s", (status, expectedLabel) => {
    render(<StatusChip status={status} />);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });
});
