// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import MyAttendanceLoading from "./loading";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("renders a history-shaped skeleton with placeholder rows", () => {
  render(<MyAttendanceLoading />);

  expect(screen.getByTestId("attendance-bento-grid-skeleton")).toBeInTheDocument();

  const historyRows = screen.getByTestId("attendance-history-skeleton-rows");
  expect(historyRows.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(5);

  const allPlaceholders = document.querySelectorAll('[data-slot="skeleton"]');
  expect(allPlaceholders.length).toBeGreaterThan(5);
});
