// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { NavProgressBar } from "./nav-progress-bar";

let mockPathname = "/dashboard";
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

afterEach(() => {
  cleanup();
  mockPathname = "/dashboard";
});

describe("NavProgressBar", () => {
  it("renders nothing until a navigation click occurs", () => {
    render(<NavProgressBar />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("appears when an internal link is clicked, and clears once the pathname updates", () => {
    const { rerender } = render(
      <div>
        <NavProgressBar />
        <a href="/students">Students</a>
      </div>
    );

    fireEvent.click(screen.getByRole("link", { name: /students/i }));
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    mockPathname = "/students";
    rerender(
      <div>
        <NavProgressBar />
        <a href="/students">Students</a>
      </div>
    );

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
