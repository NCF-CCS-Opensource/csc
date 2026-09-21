// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { ClearanceView, type ClearanceItem } from "./clearance-view";
import type { SemesterResponse } from "@attendance/contracts";

const mockSemester: SemesterResponse = {
  id: "sem-1",
  startDate: "2026-08-01",
  endDate: "2026-12-15",
  closedAt: null,
};

const mockResults: ClearanceItem[] = [
  {
    student: {
      id: "s1",
      name: "Alice Reyes",
      email: "alice@example.edu",
      studentId: "24-001",
      program: "Computer Science",
      role: "student",
    },
    outstanding: 0,
  },
  {
    student: {
      id: "s2",
      name: "Bob Cruz",
      email: "bob@example.edu",
      studentId: "24-002",
      program: "Information Technology",
      role: "student",
    },
    outstanding: 150,
  },
];

afterEach(() => {
  cleanup();
});

describe("ClearanceView Ledger Verification (Issue #206)", () => {
  it("renders on warm cream canvas with Neobrutalist structure", () => {
    const { container } = render(
      <ClearanceView
        openSemester={mockSemester}
        initialQuery=""
        initialResults={mockResults}
      />
    );

    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main?.className).toMatch(/bg-(?:page|\[#FAFADF\]|\[var\(--bg-page\))|bg-background/);
    expect(screen.getByText(/clearance verification ledger/i)).toBeInTheDocument();
  });

  it("highlights clearance readiness with Lavender badge when balance is zero", () => {
    render(
      <ClearanceView
        openSemester={mockSemester}
        initialQuery=""
        initialResults={mockResults}
      />
    );

    const aliceBadge = screen.getByTestId("clearance-badge-s1");
    expect(aliceBadge).toBeInTheDocument();
    expect(aliceBadge).toHaveAttribute("data-variant", "cleared");
    expect(aliceBadge).toHaveTextContent("Clearance-ready");
    // Lavender #C4B5FD token
    expect(aliceBadge.className).toMatch(/bg-\[var\(--color-lavender\)\]/);
  });

  it("highlights pending clearance with Coral badge when balance is greater than zero", () => {
    render(
      <ClearanceView
        openSemester={mockSemester}
        initialQuery=""
        initialResults={mockResults}
      />
    );

    const bobBadge = screen.getByTestId("clearance-badge-s2");
    expect(bobBadge).toBeInTheDocument();
    expect(bobBadge).toHaveAttribute("data-variant", "absent");
    expect(bobBadge).toHaveTextContent("Not ready");
    // Coral #E8635A token
    expect(bobBadge.className).toMatch(/bg-\[var\(--color-coral\)\]/);
  });

  it("filters students in real-time when typing in search input", () => {
    render(
      <ClearanceView
        openSemester={mockSemester}
        initialQuery=""
        initialResults={mockResults}
      />
    );

    expect(screen.getByText("Alice Reyes")).toBeInTheDocument();
    expect(screen.getByText("Bob Cruz")).toBeInTheDocument();

    const searchInput = screen.getByRole("textbox", {
      name: /search name, email, or student id/i,
    });
    fireEvent.change(searchInput, { target: { value: "Alice" } });

    expect(screen.getByText("Alice Reyes")).toBeInTheDocument();
    expect(screen.queryByText("Bob Cruz")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "24-002" } });
    expect(screen.queryByText("Alice Reyes")).not.toBeInTheDocument();
    expect(screen.getByText("Bob Cruz")).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "nomatch" } });
    expect(screen.getByText("No results yet.")).toBeInTheDocument();
  });

  it("renders tactile search input with Coral focus offset and search button", () => {
    render(
      <ClearanceView
        openSemester={mockSemester}
        initialQuery=""
        initialResults={mockResults}
      />
    );

    const searchInput = screen.getByRole("textbox", {
      name: /search name, email, or student id/i,
    });
    expect(searchInput.className).toMatch(/focus-visible:ring-\[var\(--color-coral\)\]/);
    expect(searchInput.className).toMatch(/focus-visible:border-\[var\(--color-coral\)\]/);

    const searchBtn = screen.getByRole("button", { name: /search/i });
    expect(searchBtn).toBeInTheDocument();
    expect(searchBtn.className).toMatch(/border-2/);
  });

  it("displays no open semester notice when openSemester is null", () => {
    render(
      <ClearanceView
        openSemester={null}
        initialQuery=""
        initialResults={[]}
      />
    );

    expect(screen.getByText(/no open semester — nothing to clear/i)).toBeInTheDocument();
  });
});
