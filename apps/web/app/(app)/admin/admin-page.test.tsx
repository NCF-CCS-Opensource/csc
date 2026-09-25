// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";

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
      safFeeAmount: "450.00",
    },
  ],
};

const mockPrograms = {
  programs: [
    { id: "prog-1", name: "Computer Science" },
    { id: "prog-2", name: "Information Technology" },
  ],
};

const mockCategories = {
  categories: [
    { id: "cat-1", name: "Supplies" },
    { id: "cat-2", name: "Honoraria" },
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
    if (endpoint === "expense-category/list-detailed") return Promise.resolve(mockCategories);
    return Promise.resolve({});
  });
});

afterEach(() => {
  cleanup();
});

// AdminCacheSync reads useQueryClient(), so every render needs a provider now
// (it was a plain server-rendered tree before this ticket).
function renderAdmin(page: ReactNode) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{page}</QueryClientProvider>);
}

describe("AdminPage Bento Grid & Lifecycle Management (Issue #206)", () => {
  it("renders modular Bento cells with uppercase overlines and letter spacing", async () => {
    const page = await AdminPage({ searchParams: Promise.resolve({}) });
    renderAdmin(page);

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
    renderAdmin(page);

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

  it("shows each Semester's SAF Fee and prefills a new Semester with ₱500", async () => {
    const page = await AdminPage({ searchParams: Promise.resolve({}) });
    renderAdmin(page);

    expect(screen.getByDisplayValue("450.00")).toHaveAttribute("name", "safFeeAmount");
    expect(screen.getByLabelText("SAF Fee (₱)")).toHaveValue(500);
  });

  it("displays program rosters inside the Academic Rosters Bento card", async () => {
    const page = await AdminPage({ searchParams: Promise.resolve({}) });
    renderAdmin(page);

    const cell = screen.getByTestId("academic-rosters-cell");
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveAttribute("data-slot", "bento-cell");
    expect(cell.className).toMatch(/border-2/);
    expect(cell.className).toMatch(/rounded-\[10px\]/);

    expect(screen.getByText("Computer Science")).toBeInTheDocument();
    expect(screen.getByText("Information Technology")).toBeInTheDocument();
  });

  it("displays expense categories with rename inputs inside the Expense Categories Bento card", async () => {
    const page = await AdminPage({ searchParams: Promise.resolve({}) });
    renderAdmin(page);

    const cell = screen.getByTestId("expense-categories-cell");
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveAttribute("data-slot", "bento-cell");

    // Each Category is rendered as a pre-filled rename input (not plain text),
    // so a Governor can edit it in place.
    expect(screen.getByDisplayValue("Supplies")).toHaveAttribute("name", "name");
    expect(screen.getByDisplayValue("Honoraria")).toHaveAttribute("name", "name");
  });

  it("displays officer promotion search in the Officer Roster Bento card", async () => {
    const page = await AdminPage({ searchParams: Promise.resolve({ q: "Alice" }) });
    renderAdmin(page);

    const cell = screen.getByTestId("officer-roster-cell");
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveAttribute("data-slot", "bento-cell");

    expect(screen.getByText("Alice Reyes")).toBeInTheDocument();
  });

  it("renders the Officer Roster results table above the search form when results exist", async () => {
    const page = await AdminPage({ searchParams: Promise.resolve({ q: "Alice" }) });
    renderAdmin(page);

    const cell = screen.getByTestId("officer-roster-cell");
    const table = cell.querySelector("table");
    const form = cell.querySelector("form");

    expect(table).toBeInTheDocument();
    expect(form).toBeInTheDocument();

    // Results table must precede the search form in document order.
    expect(table!.compareDocumentPosition(form!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps the Officer Roster search form present with no results table in the empty state", async () => {
    const page = await AdminPage({ searchParams: Promise.resolve({}) });
    renderAdmin(page);

    const cell = screen.getByTestId("officer-roster-cell");
    const table = cell.querySelector("table");
    const form = cell.querySelector("form");

    expect(table).not.toBeInTheDocument();
    expect(form).toBeInTheDocument();
  });
});
