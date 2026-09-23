// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import OnboardingLoading from "./loading";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("renders skeleton placeholders immediately", () => {
  render(<OnboardingLoading />);

  const main = screen.getByRole("main", { name: /loading onboarding form/i });
  expect(main).toHaveAttribute("aria-busy", "true");

  const placeholders = document.querySelectorAll('[data-slot="skeleton"]');
  expect(placeholders.length).toBeGreaterThanOrEqual(5);
});
