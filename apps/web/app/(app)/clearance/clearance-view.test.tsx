// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Radix Select scrolls the highlighted option into view on open; jsdom has no
// scrollIntoView, so stub it or the Rows-per-page interaction throws.
Element.prototype.scrollIntoView ??= () => {};

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

function renderClearance(initialResults: ClearanceItem[] = mockResults) {
  return render(
    <ClearanceView
      openSemester={mockSemester}
      initialQuery=""
      initialResults={initialResults}
    />
  );
}

describe("ClearanceView Ledger Verification (Issue #206)", () => {
  it("renders on warm cream canvas with Neobrutalist structure", () => {
    const { container } = renderClearance();

    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main?.className).toMatch(/bg-(?:page|\[#FAFADF\]|\[var\(--bg-page\))|bg-background/);
    expect(screen.getByText(/clearance verification ledger/i)).toBeInTheDocument();
  });

  it("highlights clearance readiness with Lavender badge when balance is zero", () => {
    renderClearance();

    const aliceBadge = screen.getByTestId("clearance-badge-s1");
    expect(aliceBadge).toBeInTheDocument();
    expect(aliceBadge).toHaveAttribute("data-variant", "cleared");
    expect(aliceBadge).toHaveTextContent("Clearance-ready");
    // Lavender #C4B5FD token
    expect(aliceBadge.className).toMatch(/bg-\[var\(--color-lavender\)\]/);
  });

  it("highlights pending clearance with Coral badge when balance is greater than zero", () => {
    renderClearance();

    const bobBadge = screen.getByTestId("clearance-badge-s2");
    expect(bobBadge).toBeInTheDocument();
    expect(bobBadge).toHaveAttribute("data-variant", "absent");
    expect(bobBadge).toHaveTextContent("Not ready");
    // Coral #E8635A token
    expect(bobBadge.className).toMatch(/bg-\[var\(--color-coral\)\]/);
  });

  it("filters students in real-time when typing in search input", () => {
    renderClearance();

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

  it("renders tactile search input with Coral focus offset (live client-side search)", () => {
    renderClearance();

    const searchInput = screen.getByRole("textbox", {
      name: /search name, email, or student id/i,
    });
    expect(searchInput.className).toMatch(/focus-visible:ring-\[var\(--color-coral\)\]/);
    expect(searchInput.className).toMatch(/focus-visible:border-\[var\(--color-coral\)\]/);

    expect(screen.queryByRole("button", { name: /search/i })).not.toBeInTheDocument();
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

describe("Clearance ledger pagination (Issue #220)", () => {
  function makeResults(count: number): ClearanceItem[] {
    return Array.from({ length: count }, (_, index) => ({
      student: {
        id: `s${index + 1}`,
        name: `Student ${index + 1}`,
        email: `student${index + 1}@example.edu`,
        studentId: `24-${String(index + 1).padStart(3, "0")}`,
        program: "Computer Science",
        role: "student" as const,
      },
      outstanding: 0,
    }));
  }

  const paginatedResults = makeResults(21);

  it("shows the full student list on load, no search required first", () => {
    renderClearance(paginatedResults);

    expect(screen.getByText("Student 1")).toBeInTheDocument();
    expect(screen.getByText("Student 20")).toBeInTheDocument();
    expect(screen.queryByText("Student 21")).not.toBeInTheDocument();
    expect(screen.getByText("21 total")).toBeInTheDocument();
  });

  it("defaults to 20 rows and changes pages and page sizes without reloading", () => {
    renderClearance(paginatedResults);

    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("Student 21")).toBeInTheDocument();
    expect(screen.queryByText("Student 1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("combobox", { name: "Rows per page" }));
    fireEvent.click(screen.getByRole("option", { name: "10 per page" }));
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Student 10")).toBeInTheDocument();
    expect(screen.queryByText("Student 11")).not.toBeInTheDocument();
  });

  it("search narrows the paginated list and resets to page 1", () => {
    renderClearance(paginatedResults);

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    fireEvent.change(screen.getByRole("textbox", { name: /search name, email, or student id/i }), {
      target: { value: "Student 1" },
    });

    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
    expect(screen.getByText("Student 1")).toBeInTheDocument();
  });
});
