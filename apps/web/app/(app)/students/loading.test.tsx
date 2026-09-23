// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import StudentsLoading from "./loading";

afterEach(() => {
  cleanup();
});

it("renders a table-shaped skeleton with a header row and placeholder rows", () => {
  const { container } = render(<StudentsLoading />);

  const table = container.querySelector("table");
  expect(table).toBeInTheDocument();

  const headerCells = container.querySelectorAll("thead th");
  expect(headerCells).toHaveLength(8);

  const bodyRows = container.querySelectorAll("tbody tr");
  expect(bodyRows).toHaveLength(6);

  const placeholders = container.querySelectorAll('[data-slot="skeleton"]');
  expect(placeholders.length).toBeGreaterThan(0);
});
