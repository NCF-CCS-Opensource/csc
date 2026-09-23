// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import RejectionsLoading from "./loading";

afterEach(() => {
  cleanup();
});

it("renders a skeleton without throwing", () => {
  const { container } = render(<RejectionsLoading />);

  expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
});
