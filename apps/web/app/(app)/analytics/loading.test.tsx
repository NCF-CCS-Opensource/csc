// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import AnalyticsLoading from "./loading";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("renders skeleton placeholders for the analytics report layout", () => {
  render(<AnalyticsLoading />);

  const root = screen.getByTestId("analytics-loading");
  const placeholders = root.querySelectorAll('[data-slot="skeleton"]');

  expect(placeholders.length).toBeGreaterThan(0);
});
