// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { MyAttendanceView } from "./my-attendance-view";
import type { MyAttendanceSnapshot } from "./actions";

const { snapshotMock } = vi.hoisted(() => ({
  snapshotMock: vi.fn(),
}));

vi.mock("./actions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./actions")>();
  return {
    ...actual,
    myAttendanceSnapshot: snapshotMock,
  };
});

const mockStudent = {
  name: "Juan Dela Cruz",
  email: "jdelacruz@example.edu",
  program: "BS Computer Science",
  studentId: "24-00123",
};

const mockSnapshotWithDebt: MyAttendanceSnapshot = {
  student: mockStudent,
  hasOpenSemester: true,
  ledger: {
    total: 150,
    outstanding: 50,
    sessions: [
      {
        eventId: "ev-1",
        eventName: "General Assembly",
        eventDate: "2026-09-15",
        half: "am",
        timeIn: "08:05",
        timeOut: "12:00",
        status: "present",
        amount: 0,
        paid: true,
      },
      {
        eventId: "ev-1",
        eventName: "General Assembly",
        eventDate: "2026-09-15",
        half: "pm",
        timeIn: "13:00",
        timeOut: null,
        status: "incomplete",
        amount: 50,
        paid: false,
      },
      {
        eventId: "ev-2",
        eventName: "Tech Symposium",
        eventDate: "2026-09-18",
        half: "am",
        timeIn: null,
        timeOut: null,
        status: "absent",
        amount: 100,
        paid: true,
      },
    ],
  },
  paymentHistory: [
    {
      id: "pay-1",
      amount: "100.00",
      paidOn: "9/19/2026",
    },
  ],
};

const mockSnapshotCleared: MyAttendanceSnapshot = {
  student: mockStudent,
  hasOpenSemester: true,
  ledger: {
    total: 0,
    outstanding: 0,
    sessions: [
      {
        eventId: "ev-1",
        eventName: "Leadership Summit",
        eventDate: "2026-09-10",
        half: "am",
        timeIn: "08:00",
        timeOut: "12:00",
        status: "present",
        amount: 0,
        paid: true,
      },
    ],
  },
  paymentHistory: [],
};

const mockSnapshotNoOpenSemester: MyAttendanceSnapshot = {
  student: mockStudent,
  hasOpenSemester: false,
  ledger: {
    total: 0,
    outstanding: 0,
    sessions: [],
  },
  paymentHistory: [],
};

function renderView(snapshot: MyAttendanceSnapshot) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MyAttendanceView initialData={snapshot} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  snapshotMock.mockReset();
  snapshotMock.mockResolvedValue(mockSnapshotWithDebt);
});

afterEach(() => {
  cleanup();
});

describe("MyAttendanceView Bento Layout (Issue #204)", () => {
  it("adopts the 4-column Bento Grid structure on warm cream canvas", () => {
    const { container } = renderView(mockSnapshotWithDebt);

    // Warm cream canvas container
    const canvas = container.querySelector("main");
    expect(canvas).toBeInTheDocument();
    expect(canvas?.className).toMatch(/bg-(?:page|\[#FAFADF\]|\[var\(--bg-page\))|bg-background/);

    // Bento Grid layout container
    const bentoGrid = screen.getByTestId("attendance-bento-grid");
    expect(bentoGrid).toBeInTheDocument();
    expect(bentoGrid).toHaveAttribute("data-slot", "bento-grid");
    expect(bentoGrid.className).toMatch(/bento-grid/);
    expect(bentoGrid.className).toMatch(/grid-cols-1.*min-\[521px\]:grid-cols-2.*min-\[901px\]:grid-cols-4/);
  });

  it("renders active Penalty Ledger balance and clearance readiness inside a dominant Hero 2x2 Bento cell with 6px hard shadow", () => {
    renderView(mockSnapshotWithDebt);

    const heroCell = screen.getByTestId("ledger-hero-cell");
    expect(heroCell).toBeInTheDocument();
    expect(heroCell).toHaveAttribute("data-slot", "bento-cell");
    expect(heroCell).toHaveAttribute("data-span", "hero");
    expect(heroCell).toHaveAttribute("data-elevation", "hero");

    // Check 6px hard shadow and 2x2 span
    expect(heroCell.className).toMatch(/shadow-\[var\(--shadow-lg\)\]/);
    expect(heroCell.className).toMatch(/col-span-2/);
    expect(heroCell.className).toMatch(/row-span-2/);

    // Check ledger balance accuracy
    expect(within(heroCell).getByTestId("outstanding-balance-amount")).toHaveTextContent("₱50.00");
    expect(within(heroCell).getByText("Outstanding Balance")).toBeInTheDocument();
    expect(within(heroCell).getByTestId("total-penalties-amount")).toHaveTextContent("₱150.00");

    // Check clearance readiness standing with outstanding balance
    const clearanceBadge = within(heroCell).getByTestId("clearance-status-badge");
    expect(clearanceBadge).toBeInTheDocument();
    expect(clearanceBadge).toHaveTextContent(/Pending|Action Required/i);
    expect(within(heroCell).getByText(/settle/i)).toBeInTheDocument();
  });

  it("renders clearance readiness as Cleared when outstanding balance is zero", () => {
    renderView(mockSnapshotCleared);

    const heroCell = screen.getByTestId("ledger-hero-cell");
    expect(within(heroCell).getByTestId("outstanding-balance-amount")).toHaveTextContent("₱0.00");

    const clearanceBadge = within(heroCell).getByTestId("clearance-status-badge");
    expect(clearanceBadge).toBeInTheDocument();
    expect(clearanceBadge).toHaveTextContent(/Cleared|Ready/i);
    expect(clearanceBadge).toHaveAttribute("data-variant", "cleared");
  });

  it("renders informative status when no open semester is present", () => {
    renderView(mockSnapshotNoOpenSemester);

    const heroCell = screen.getByTestId("ledger-hero-cell");
    expect(within(heroCell).getByTestId("clearance-status-badge")).toHaveTextContent(/No open semester/i);
  });

  it("renders attendance session history in a Wide Bento cell with clear status pills in correct colors", () => {
    renderView(mockSnapshotWithDebt);

    const historyCell = screen.getByTestId("attendance-history-cell");
    expect(historyCell).toBeInTheDocument();
    expect(historyCell).toHaveAttribute("data-slot", "bento-cell");
    expect(historyCell).toHaveAttribute("data-span", "wide");
    expect(historyCell.className).toMatch(/col-span-2/);

    // Present status pill (Teal #4ECDC4)
    const presentBadge = screen.getByTestId("status-badge-ev-1-am");
    expect(presentBadge).toBeInTheDocument();
    expect(presentBadge).toHaveTextContent("Present");
    expect(presentBadge).toHaveAttribute("data-variant", "present");
    expect(presentBadge.className).toMatch(/bg-\[var\(--color-teal\)\]/);

    // Incomplete status pill (Yellow #FFE566)
    const incompleteBadge = screen.getByTestId("status-badge-ev-1-pm");
    expect(incompleteBadge).toBeInTheDocument();
    expect(incompleteBadge).toHaveTextContent("Incomplete");
    expect(incompleteBadge).toHaveAttribute("data-variant", "incomplete");
    expect(incompleteBadge.className).toMatch(/bg-\[var\(--color-yellow\)\]/);

    // Absent status pill (Coral #E8635A)
    const absentBadge = screen.getByTestId("status-badge-ev-2-am");
    expect(absentBadge).toBeInTheDocument();
    expect(absentBadge).toHaveTextContent("Absent");
    expect(absentBadge).toHaveAttribute("data-variant", "absent");
    expect(absentBadge.className).toMatch(/bg-\[var\(--color-coral\)\]/);
  });

  it("renders digital and printable QR Card view in a high-contrast container with distinct borders", () => {
    renderView(mockSnapshotWithDebt);

    const qrCell = screen.getByTestId("qr-card-cell");
    expect(qrCell).toBeInTheDocument();
    expect(qrCell).toHaveAttribute("data-slot", "bento-cell");
    expect(qrCell).toHaveAttribute("data-span", "wide");

    // High-contrast container with distinct borders for fast camera scanning
    const qrContainer = screen.getByTestId("qr-code-container");
    expect(qrContainer).toBeInTheDocument();
    expect(qrContainer.className).toMatch(/border-2/);
    expect(qrContainer.className).toMatch(/border-\[#111111\]|border-border/);

    // QR Image
    const qrImage = screen.getByRole("img", { name: /attendance qr code/i });
    expect(qrImage).toBeInTheDocument();
    expect(qrImage).toHaveAttribute("src", "/qr");

    // Student identity details
    expect(within(qrCell).getByText("Juan Dela Cruz")).toBeInTheDocument();
    expect(within(qrCell).getByText(/24-00123/)).toBeInTheDocument();
    expect(within(qrCell).getByText("BS Computer Science")).toBeInTheDocument();

    // Download QR Card CTA button using pill variant
    const downloadLink = screen.getByRole("link", { name: /download qr card/i });
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute("href", "/qr/card");
    expect(downloadLink).toHaveAttribute("download", "qr-card.pdf");
    expect(downloadLink.className).toMatch(/rounded-full/);
  });

  it("renders payment history and mobile responsive collapse classes", () => {
    renderView(mockSnapshotWithDebt);

    // Payment history cell
    const paymentCell = screen.getByTestId("payment-history-cell");
    expect(paymentCell).toBeInTheDocument();
    expect(within(paymentCell).getByText(/₱100\.00/)).toBeInTheDocument();
    expect(within(paymentCell).getByText("9/19/2026")).toBeInTheDocument();

    // Mobile responsive collapse assertions on grid and cells (<520px collapses to 1 col)
    const heroCell = screen.getByTestId("ledger-hero-cell");
    expect(heroCell.className).toMatch(/max-\[520px\]:col-span-1/);
    expect(heroCell.className).toMatch(/max-\[520px\]:row-span-1/);

    const qrCell = screen.getByTestId("qr-card-cell");
    expect(qrCell.className).toMatch(/max-\[520px\]:col-span-1/);

    const historyCell = screen.getByTestId("attendance-history-cell");
    expect(historyCell.className).toMatch(/max-\[520px\]:col-span-1/);

    const paymentHistoryCell = screen.getByTestId("payment-history-cell");
    expect(paymentHistoryCell.className).toMatch(/max-\[520px\]:col-span-1/);
  });
});
