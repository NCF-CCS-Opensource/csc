// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import AttendanceLoading from "./loading";

afterEach(() => {
  cleanup();
});

it("renders a grid-shaped skeleton with the real columns and placeholder rows", () => {
  render(<AttendanceLoading />);

  expect(screen.getByText("Student")).toBeInTheDocument();
  expect(screen.getAllByText("Session").length).toBe(2);
  expect(screen.getByText("Payment")).toBeInTheDocument();

  expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
});
