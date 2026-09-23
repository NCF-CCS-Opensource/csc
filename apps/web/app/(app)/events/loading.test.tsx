// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import EventsLoading from "./loading";

afterEach(() => {
  cleanup();
});

it("renders a table-shaped skeleton with the real columns and placeholder rows", () => {
  render(<EventsLoading />);

  expect(screen.getByText("Name")).toBeInTheDocument();
  expect(screen.getByText("Date")).toBeInTheDocument();
  expect(screen.getByText("Type")).toBeInTheDocument();
  expect(screen.getByText("Penalty")).toBeInTheDocument();
  expect(screen.getByText("Attendance")).toBeInTheDocument();

  expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
});
