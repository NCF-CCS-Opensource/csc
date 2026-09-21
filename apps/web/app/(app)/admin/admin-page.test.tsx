// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { requireGovernorMock, apiPostMock } = vi.hoisted(() => ({
  requireGovernorMock: vi.fn(),
  apiPostMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireGovernor: requireGovernorMock,
}));

vi.mock("@/lib/api-client", () => ({
  apiPost: apiPostMock,
}));

import AdminPage from "./page";

const mockSemesters = {
  semesters: [
    {
      id: "sem-1",
      startDate: "2026-08-01",
      endDate: "2026-12-15",
      closedAt: null,
    },
  ],
};

const mockPrograms = {
  programs: [
    { id: "prog-1", name: "Computer Science" },
    { id: "prog-2", name: "Information Technology" },
  ],
};

const mockStudents = {
  students: [
    {
      id: "s1",
      name: "Alice Reyes",
      email: "alice@example.edu",
      studentId: "24-001",
      program: "Computer Science",
      role: "student" as const,
    },
  ],
};

beforeEach(() => {
  requireGovernorMock.mockReset();
  requireGovernorMock.mockResolvedValue(undefined);

  apiPostMock.mockReset();
  apiPostMock.mockImplementation((endpoint: string) => {
    if (endpoint === "semester/list") return Promise.resolve(mockSemesters);
    if (endpoint === "program/list-detailed") return Promise.resolve(mockPrograms);
    if (endpoint === "student/list") return Promise.resolve(mockStudents);
    return Promise.resolve({});
  });
});

afterEach(() => {
  cleanup();
});

describe("AdminPage Bento Grid & Lifecycle Management (Issue #206)", () => {
  it("renders modular Bento cells with uppercase overlines and letter spacing", async () => {
    const page = await AdminPage({ searchParams: Promise.resolve({}) });
    render(page);

    // Overline 1: SEMESTER LIFECYCLE
    const semesterOverline = screen.getByText("SEMESTER LIFECYCLE");
    expect(semesterOverline).toBeInTheDocument();
    expect(semesterOverline).toHaveAttribute("data-slot", "bento-cell-overline");
    expect(semesterOverline.className).toMatch(/uppercase/);
    expect(semesterOverline.className).toMatch(/tracking-\[0\.08em\]/);
    expect(semesterOverline.className).toMatch(/text-\[#888888\]/);

    // Overline 2: ACADEMIC ROSTERS
    const academicOverline = screen.getByText("ACADEMIC ROSTERS");
    expect(academicOverline).toBeInTheDocument();
    expect(academicOverline).toHaveAttribute("data-slot", "bento-cell-overline");
    expect(academicOverline.className).toMatch(/uppercase/);
    expect(academicOverline.className).toMatch(/tracking-\[0\.08em\]/);

    // Overline 3: OFFICER ROSTER
    const officerOverline = screen.getByText("OFFICER ROSTER");
    expect(officerOverline).toBeInTheDocument();
    expect(officerOverline).toHaveAttribute("data-slot", "bento-cell-overline");
    expect(officerOverline.className).toMatch(/uppercase/);
    expect(officerOverline.className).toMatch(/tracking-\[0\.08em\]/);
  });

  it("displays date boundaries inside the Semester Lifecycle Bento card", async () => {
    const page = await AdminPage({ searchParams: Promise.resolve({}) });
    render(page);

    const cell = screen.getByTestId("semester-lifecycle-cell");
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveAttribute("data-slot", "bento-cell");
    expect(cell.className).toMatch(/border-2/);
    expect(cell.className).toMatch(/rounded-\[10px\]/);

    // Verify date boundary inputs display the semester dates
    const startDateInput = screen.getByDisplayValue("2026-08-01");
    expect(startDateInput).toBeInTheDocument();

    const endDateInput = screen.getByDisplayValue("2026-12-15");
    expect(endDateInput).toBeInTheDocument();
  });

  it("displays program rosters inside the Academic Rosters Bento card", async () => {
    const page = await AdminPage({ searchParams: Promise.resolve({}) });
    render(page);

    const cell = screen.getByTestId("academic-rosters-cell");
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveAttribute("data-slot", "bento-cell");
    expect(cell.className).toMatch(/border-2/);
    expect(cell.className).toMatch(/rounded-\[10px\]/);

    expect(screen.getByText("Computer Science")).toBeInTheDocument();
    expect(screen.getByText("Information Technology")).toBeInTheDocument();
  });

  it("displays officer promotion search in the Officer Roster Bento card", async () => {
    const page = await AdminPage({ searchParams: Promise.resolve({ q: "Alice" }) });
    render(page);

    const cell = screen.getByTestId("officer-roster-cell");
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveAttribute("data-slot", "bento-cell");

    expect(screen.getByText("Alice Reyes")).toBeInTheDocument();
  });
});
