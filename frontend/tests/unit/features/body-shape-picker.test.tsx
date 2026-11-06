import { existsSync } from "node:fs";
import { join } from "node:path";

import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { BODY_CATEGORIES, bodyShapeImage } from "@/features/shopper/body-shapes";
import {
  BodyShapePicker,
  type BodyShapeValue,
} from "@/features/shopper/components/body-shape/body-shape-picker";

function Harness({ initial }: { initial: BodyShapeValue }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <BodyShapePicker value={value} onChange={setValue} />
      <output data-testid="value">{`${value.category}/${value.shape}`}</output>
    </>
  );
}

describe("BodyShapePicker", () => {
  it("has a rendered figure for every shape", () => {
    for (const category of BODY_CATEGORIES) {
      for (const shape of category.shapes) {
        const path = join("public", bodyShapeImage(category.value, shape.value));
        expect(existsSync(path), path).toBe(true);
      }
    }
  });

  it("offers all four profile categories", () => {
    render(<Harness initial={{ category: "", shape: "" }} />);
    for (const label of ["Women", "Men", "Girls", "Boys"]) {
      expect(screen.getByRole("radio", { name: new RegExp(label) })).toBeInTheDocument();
    }
    expect(screen.getByText(/choose who this profile is for/i)).toBeInTheDocument();
  });

  it("shows each category's own shapes", () => {
    render(<Harness initial={{ category: "", shape: "" }} />);

    fireEvent.click(screen.getByRole("radio", { name: /^men/i }));
    expect(screen.getByRole("radio", { name: /trapezoid/i })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /hourglass/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /^boys/i }));
    expect(screen.getByRole("group", { name: /fit type/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /husky/i })).toBeInTheDocument();
  });

  it("keeps a shared shape when switching category, and clears one that doesn't apply", () => {
    render(<Harness initial={{ category: "women", shape: "rectangle" }} />);

    fireEvent.click(screen.getByRole("radio", { name: /^men/i }));
    expect(screen.getByTestId("value")).toHaveTextContent("men/rectangle");

    fireEvent.click(screen.getByRole("radio", { name: /^girls/i }));
    expect(screen.getByTestId("value")).toHaveTextContent("girls/");
  });

  it("mirrors the backend shape list", () => {
    // Keep in sync with BODY_SHAPES_BY_CATEGORY in backend/app/models/user.py.
    expect(
      Object.fromEntries(BODY_CATEGORIES.map((c) => [c.value, c.shapes.map((s) => s.value)])),
    ).toEqual({
      women: ["hourglass", "pear", "apple", "rectangle", "inverted_triangle"],
      men: ["rectangle", "triangle", "inverted_triangle", "oval", "trapezoid"],
      girls: ["slim", "regular", "plus"],
      boys: ["slim", "regular", "husky"],
    });
  });
});
