// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import ClearanceLoading from "./loading";

afterEach(() => {
  cleanup();
});

it("renders a table-shaped skeleton immediately", () => {
  render(<ClearanceLoading />);

  expect(screen.getByTestId("clearance-loading-table")).toBeInTheDocument();
  expect(screen.getAllByTestId("clearance-loading-row").length).toBeGreaterThan(0);
});
