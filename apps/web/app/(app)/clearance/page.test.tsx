// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { requireOfficerOrGovernorMock, apiFetchMock, apiPostMock, getOpenSemesterMock } = vi.hoisted(
  () => ({
    requireOfficerOrGovernorMock: vi.fn(),
    apiFetchMock: vi.fn(),
    apiPostMock: vi.fn(),
    getOpenSemesterMock: vi.fn(),
  }),
);

vi.mock("@/lib/auth", () => ({
  requireOfficerOrGovernor: requireOfficerOrGovernorMock,
}));

vi.mock("@/lib/api-client", () => ({
  apiFetch: apiFetchMock,
  apiPost: apiPostMock,
}));

vi.mock("@/lib/queries/open-semester", () => ({
  getOpenSemester: getOpenSemesterMock,
}));

import ClearancePage from "./page";

const mockSemester = {
  id: "sem-1",
  startDate: "2026-08-01",
  endDate: "2026-12-15",
  closedAt: null,
};

const mockStudents = {
  students: [
    { id: "s1", name: "Alice Reyes", email: "alice@example.edu", studentId: "24-001", program: "Computer Science", role: "student" as const },
    { id: "s2", name: "Bob Cruz", email: "bob@example.edu", studentId: "24-002", program: "Information Technology", role: "student" as const },
    { id: "s3", name: "Cara Diaz", email: "cara@example.edu", studentId: "24-003", program: "Computer Science", role: "student" as const },
  ],
};

// Same per-Student outstanding balances the old /ledger/student loop used to
// return, keyed by Student id — the regression guard for issue #282.
const mockBatchLedger = {
  s1: { total: 500, outstanding: 0, sessions: [] },
  s2: { total: 500, outstanding: 250, sessions: [] },
  s3: { total: 500, outstanding: 500, sessions: [] },
};

beforeEach(() => {
  requireOfficerOrGovernorMock.mockReset();
  requireOfficerOrGovernorMock.mockResolvedValue(undefined);

  getOpenSemesterMock.mockReset();
  getOpenSemesterMock.mockResolvedValue(mockSemester);

  apiPostMock.mockReset();
  apiPostMock.mockImplementation((endpoint: string) => {
    if (endpoint === "student/list") return Promise.resolve(mockStudents);
    return Promise.resolve({});
  });

  apiFetchMock.mockReset();
  apiFetchMock.mockImplementation((path: string) => {
    if (path === "/v1/api/ledger/students") return Promise.resolve(mockBatchLedger);
    return Promise.resolve(null);
  });
});

afterEach(() => {
  cleanup();
});

describe("ClearancePage Ledger loading (issue #282)", () => {
  it("issues exactly one batched Ledger request regardless of enrolled Student count", async () => {
    const page = await ClearancePage({ searchParams: Promise.resolve({}) });
    render(page);

    const ledgerCalls = apiFetchMock.mock.calls.filter(([path]) => path === "/v1/api/ledger/students");
    expect(ledgerCalls).toHaveLength(1);
    expect(apiFetchMock).not.toHaveBeenCalledWith("/v1/api/ledger/student", expect.anything());
  });

  it("calls the batched endpoint with the open Semester id", async () => {
    const page = await ClearancePage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(apiFetchMock).toHaveBeenCalledWith("/v1/api/ledger/students", { semesterId: "sem-1" });
  });

  it("displays each Student's outstanding balance unchanged from the previous per-Student fetch", async () => {
    const page = await ClearancePage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.getByTestId("clearance-row-s1")).toHaveTextContent("₱0.00");
    expect(screen.getByTestId("clearance-row-s2")).toHaveTextContent("₱250.00");
    expect(screen.getByTestId("clearance-row-s3")).toHaveTextContent("₱500.00");
  });

  it("shows zero outstanding for every Student when there is no open Semester, without calling the Ledger", async () => {
    getOpenSemesterMock.mockResolvedValue(null);

    const page = await ClearancePage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(apiFetchMock).not.toHaveBeenCalledWith("/v1/api/ledger/students", expect.anything());
    expect(screen.getByTestId("clearance-row-s1")).toHaveTextContent("₱0.00");
  });
});

describe("ClearancePage fetch waterfall (issue #313)", () => {
  it("issues the batched Ledger request as soon as the open Semester resolves, without waiting for the Student list", async () => {
    let resolveSemester!: (value: typeof mockSemester) => void;
    let resolveStudents!: (value: typeof mockStudents) => void;

    getOpenSemesterMock.mockReset();
    getOpenSemesterMock.mockReturnValue(
      new Promise((resolve) => {
        resolveSemester = resolve;
      }),
    );

    apiPostMock.mockReset();
    apiPostMock.mockImplementation((endpoint: string) => {
      if (endpoint === "student/list") {
        return new Promise((resolve) => {
          resolveStudents = resolve;
        });
      }
      return Promise.resolve({});
    });

    const pagePromise = ClearancePage({ searchParams: Promise.resolve({}) });

    // Resolve the Semester first; the Student list is still pending.
    resolveSemester(mockSemester);
    await vi.waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith("/v1/api/ledger/students", { semesterId: "sem-1" });
    });

    // Only now let the Student list resolve so the page can finish rendering.
    resolveStudents(mockStudents);
    const page = await pagePromise;
    render(page);

    expect(screen.getByTestId("clearance-row-s1")).toHaveTextContent("₱0.00");
  });
});
