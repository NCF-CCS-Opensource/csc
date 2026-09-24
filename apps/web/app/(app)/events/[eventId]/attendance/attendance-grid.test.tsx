// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";

import { AttendanceGrid } from "./attendance-grid";
import type { EventGridRow } from "@attendance/contracts";

// jsdom doesn't implement scrollIntoView; stub it or opening the Radix
// "Rows per page" Select throws.
Element.prototype.scrollIntoView ??= () => {};

const { setScanFieldMock, markPaidMock, eventGridMock } = vi.hoisted(() => ({
  setScanFieldMock: vi.fn(),
  markPaidMock: vi.fn(),
  eventGridMock: vi.fn(),
}));

vi.mock("./actions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./actions")>();
  return {
    ...actual,
    setScanField: setScanFieldMock,
    markPaid: markPaidMock,
    eventGrid: eventGridMock,
  };
});

const mockRows: EventGridRow[] = [
  {
    studentId: "st-1",
    name: "Juan Dela Cruz",
    studentIdText: "24-00001",
    settled: false,
    outstanding: 100,
    unpaidPenaltyIds: ["pen-1", "pen-2"],
    cells: [
      { sessionId: "sess-1", field: "timeIn", label: "AM In", present: true },
      { sessionId: "sess-1", field: "timeOut", label: "AM Out", present: false },
    ],
  },
  {
    studentId: "st-2",
    name: "Maria Clara",
    studentIdText: "24-00002",
    settled: true,
    outstanding: 0,
    unpaidPenaltyIds: [],
    cells: [
      { sessionId: "sess-1", field: "timeIn", label: "AM In", present: true },
      { sessionId: "sess-1", field: "timeOut", label: "AM Out", present: true },
    ],
  },
  {
    studentId: "st-3",
    name: "Jose Rizal",
    studentIdText: "24-00003",
    settled: false,
    outstanding: 0,
    unpaidPenaltyIds: [],
    cells: [
      { sessionId: "sess-1", field: "timeIn", label: "AM In", present: true },
      { sessionId: "sess-1", field: "timeOut", label: "AM Out", present: true },
    ],
  },
];

function renderGrid(rows: EventGridRow[] = mockRows, eventId = "ev-123") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AttendanceGrid eventId={eventId} initialRows={rows} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  eventGridMock.mockResolvedValue(mockRows);
  setScanFieldMock.mockResolvedValue({ eventId: "ev-123" });
  markPaidMock.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AttendanceGrid & Sentinel Controls", () => {
  it("renders distinct Present and Absent sentinel buttons with tactile press-down states", () => {
    renderGrid();

    // Scope to Juan Dela Cruz (row 1)
    const row1 = screen.getByText("Juan Dela Cruz").closest("tr")!;

    // In row 1, AM In is present (true)
    const amInGroup = within(row1).getByRole("group", { name: /Attendance status for AM In/ });
    const presentBtn = within(amInGroup).getByRole("button", { name: "Present" });
    const absentBtn = within(amInGroup).getByRole("button", { name: "Absent" });

    // Present button has teal active state
    expect(presentBtn).toHaveAttribute("aria-pressed", "true");
    expect(presentBtn.className).toContain("bg-[var(--color-teal)]");
    expect(presentBtn.className).toContain("hover:translate-x-[1px]");
    expect(presentBtn.className).toContain("active:translate-x-[2px]");

    // Absent button is inactive
    expect(absentBtn).toHaveAttribute("aria-pressed", "false");
    expect(absentBtn.className).toContain("bg-card");

    // In row 1, AM Out is absent (false)
    const amOutGroup = within(row1).getByRole("group", { name: /Attendance status for AM Out/ });
    const outPresentBtn = within(amOutGroup).getByRole("button", { name: "Present" });
    const outAbsentBtn = within(amOutGroup).getByRole("button", { name: "Absent" });

    // Absent button has coral active state
    expect(outAbsentBtn).toHaveAttribute("aria-pressed", "true");
    expect(outAbsentBtn.className).toContain("bg-[var(--color-coral)]");
    expect(outAbsentBtn.className).toContain("hover:translate-x-[1px]");
    expect(outAbsentBtn.className).toContain("active:translate-x-[2px]");

    // Present button is inactive
    expect(outPresentBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("clicking Absent button on a Present cell opens a confirmation before calling setScanField", async () => {
    renderGrid();

    const row1 = screen.getByText("Juan Dela Cruz").closest("tr")!;
    const amInGroup = within(row1).getByRole("group", { name: /Attendance status for AM In/ });
    const absentBtn = within(amInGroup).getByRole("button", { name: "Absent" });

    fireEvent.click(absentBtn);

    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText("Mark Juan Dela Cruz AM In Absent?"),
    ).toBeInTheDocument();
    expect(setScanFieldMock).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(setScanFieldMock).toHaveBeenCalledWith("sess-1", "timeIn", false);
    });
  });

  it("clicking Present button on an Absent cell opens a confirmation before calling setScanField", async () => {
    renderGrid();

    const row1 = screen.getByText("Juan Dela Cruz").closest("tr")!;
    const amOutGroup = within(row1).getByRole("group", { name: /Attendance status for AM Out/ });
    const presentBtn = within(amOutGroup).getByRole("button", { name: "Present" });

    fireEvent.click(presentBtn);

    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText("Mark Juan Dela Cruz AM Out Present?"),
    ).toBeInTheDocument();
    expect(setScanFieldMock).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(setScanFieldMock).toHaveBeenCalledWith("sess-1", "timeOut", true);
    });
  });

  it("cancelling the confirmation leaves the attendance record unchanged", async () => {
    renderGrid();

    const row1 = screen.getByText("Juan Dela Cruz").closest("tr")!;
    const amInGroup = within(row1).getByRole("group", { name: /Attendance status for AM In/ });
    fireEvent.click(within(amInGroup).getByRole("button", { name: "Absent" }));

    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(setScanFieldMock).not.toHaveBeenCalled();
  });

  it("opens Cash Penalty Payment dialog with Neobrutalist form and triggers markPaid", async () => {
    renderGrid();

    // Juan has ₱100 outstanding
    expect(screen.getByText("₱100")).toBeInTheDocument();

    const markPaidBtn = screen.getByRole("button", { name: "Mark paid" });
    expect(markPaidBtn).toBeInTheDocument();

    // Trigger payment modal
    fireEvent.click(markPaidBtn);

    // Modal opens
    const dialogTitle = await screen.findByText(/Cash Penalty Payment — Juan Dela Cruz/);
    expect(dialogTitle).toBeInTheDocument();

    // Check Neobrutalist inputs with coral focus shifts
    const penaltyDueInput = screen.getByLabelText(/Penalty Amount Due/);
    expect(penaltyDueInput).toHaveValue("₱100");
    expect(penaltyDueInput.className).toContain("border-2 border-border");
    expect(penaltyDueInput.className).toContain("shadow-[var(--shadow-sm)]");
    expect(penaltyDueInput.className).toContain("focus:ring-[var(--color-coral)]");
    expect(penaltyDueInput.className).toContain("focus:border-[var(--color-coral)]");

    const cashTenderedInput = screen.getByLabelText(/Cash Tendered/);
    expect(cashTenderedInput).toHaveValue(100);
    expect(cashTenderedInput.className).toContain("border-2 border-border");
    expect(cashTenderedInput.className).toContain("shadow-[var(--shadow-sm)]");
    expect(cashTenderedInput.className).toContain("focus:ring-[var(--color-coral)]");

    const notesInput = screen.getByLabelText(/Receipt Reference/);
    expect(notesInput).toBeInTheDocument();

    // Confirm payment button with tactile default variant
    const confirmBtn = screen.getByRole("button", { name: "Confirm Cash Payment" });
    expect(confirmBtn).toHaveAttribute("data-variant", "default");

    // Click confirm
    fireEvent.click(confirmBtn);

    expect(markPaidMock).toHaveBeenCalledWith(["pen-1", "pen-2"], "ev-123");
  });

  it("shows markPaid's rejection message inline instead of crashing to the error boundary", async () => {
    markPaidMock.mockRejectedValueOnce(
      new Error("Officers cannot record a payment for their own Penalty"),
    );
    renderGrid();

    fireEvent.click(screen.getByRole("button", { name: "Mark paid" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm Cash Payment" }));

    expect(
      await screen.findByText("Officers cannot record a payment for their own Penalty"),
    ).toBeInTheDocument();
  });

  it("renders Paid badge for settled student and dash for 0 balance", () => {
    renderGrid();

    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("filters students by search query in name or Student ID", () => {
    renderGrid();

    expect(screen.getByText(/Juan Dela Cruz/)).toBeInTheDocument();
    expect(screen.getByText(/Maria Clara/)).toBeInTheDocument();
    expect(screen.getByText(/Jose Rizal/)).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search by name or Student ID/);
    fireEvent.change(searchInput, { target: { value: "Maria" } });

    expect(screen.queryByText(/Juan Dela Cruz/)).not.toBeInTheDocument();
    expect(screen.getByText(/Maria Clara/)).toBeInTheDocument();
    expect(screen.queryByText(/Jose Rizal/)).not.toBeInTheDocument();
  });

  it("stacks Present/Absent toggles per session field so columns stay narrow (no horizontal scroll)", () => {
    renderGrid(mockRows, "ev-responsive");

    const row1 = screen.getByText("Juan Dela Cruz").closest("tr")!;
    const amInGroup = within(row1).getByRole("group", { name: /Attendance status for AM In/ });

    // Present above Absent (flex-col) keeps each session-field column narrow
    // enough for the whole grid to fit the viewport instead of scrolling
    // sideways, and the Student name cell wraps rather than forcing nowrap.
    expect(amInGroup.className).toContain("flex-col");
    expect(within(amInGroup).getByRole("button", { name: "Present" })).toBeInTheDocument();
    expect(within(amInGroup).getByRole("button", { name: "Absent" })).toBeInTheDocument();

    const nameCell = screen.getByText("Juan Dela Cruz").closest("td")!;
    expect(nameCell.className).toContain("whitespace-normal");
    expect(nameCell.className).not.toContain("whitespace-nowrap");

    // Below tablet width (globals.css media query) the table flattens each
    // row into stacked labeled fields instead of scrolling; every cell carries
    // its header text in data-label so a stacked cell still names its session.
    expect(
      screen.getByText("Juan Dela Cruz").closest(".attendance-grid")!,
    ).toBeInTheDocument();
    expect(nameCell).toHaveAttribute("data-label", "Student");
    expect(amInGroup.closest("td")).toHaveAttribute("data-label", "AM In");
  });
});

describe("AttendanceGrid pagination (Issue #221)", () => {
  function buildRows(count: number): EventGridRow[] {
    return Array.from({ length: count }, (_, index) => ({
      studentId: `st-${index + 1}`,
      name: `Student ${index + 1}`,
      studentIdText: `24-${String(index + 1).padStart(5, "0")}`,
      settled: false,
      outstanding: 0,
      unpaidPenaltyIds: [],
      cells: [
        { sessionId: "sess-1", field: "timeIn", label: "AM In", present: true },
        { sessionId: "sess-1", field: "timeOut", label: "AM Out", present: false },
      ],
    }));
  }

  it("defaults to 20 rows per page and pages to the remainder", () => {
    renderGrid(buildRows(21), "ev-pag-1");

    expect(screen.getByText("Student 20")).toBeInTheDocument();
    expect(screen.queryByText("Student 21")).not.toBeInTheDocument();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("Student 21")).toBeInTheDocument();
    expect(screen.queryByText("Student 1")).not.toBeInTheDocument();
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
  });

  it("changes rows per page with the shared 10/15/20 control", () => {
    renderGrid(buildRows(25), "ev-pag-2");

    fireEvent.click(screen.getByRole("combobox", { name: "Rows per page" }));
    fireEvent.click(screen.getByRole("option", { name: "10 per page" }));

    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Student 10")).toBeInTheDocument();
    expect(screen.queryByText("Student 11")).not.toBeInTheDocument();
  });

  it("resets to the first page when searching the paginated list", () => {
    renderGrid(buildRows(25), "ev-pag-3");

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Search by name or Student ID/), {
      target: { value: "Student 1" },
    });

    // "Student 1" matches 1, 10..19 (11 rows) → single filtered page, from page 1.
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
    expect(screen.getByText("Student 1")).toBeInTheDocument();
    expect(screen.queryByText("Student 2")).not.toBeInTheDocument();
  });
});
