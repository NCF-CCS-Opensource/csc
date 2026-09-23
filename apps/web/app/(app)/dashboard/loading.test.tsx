// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import DashboardLoading from "./loading";

afterEach(() => {
  cleanup();
});

it("renders a skeleton placeholder for each of the seven dashboard cards", () => {
  const { container } = render(<DashboardLoading />);

  const cells = container.querySelectorAll('[data-slot="bento-cell"]');
  const skeletons = container.querySelectorAll('[data-slot="skeleton"]');

  expect(cells).toHaveLength(7);
  expect(skeletons.length).toBeGreaterThan(0);
});
