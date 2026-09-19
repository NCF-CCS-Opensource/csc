// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import AppError from "./error";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("shows a plain-language message and hides the raw error, and retry calls reset", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const reset = vi.fn();
  const error = Object.assign(
    new Error("connect ECONNREFUSED postgresql://user:pass@10.0.0.5:5432/attendance"),
    { digest: "abc123" }
  );

  render(<AppError error={error} reset={reset} />);

  expect(screen.getByText(/can.t reach the system right now/i)).toBeInTheDocument();
  expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument();
  expect(screen.queryByText(/postgresql:\/\//)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /try again/i }));
  expect(reset).toHaveBeenCalledOnce();
});
