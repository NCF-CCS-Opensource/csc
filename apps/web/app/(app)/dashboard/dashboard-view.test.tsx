// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";

import { DashboardView } from "./dashboard-view";
import type { DashboardSnapshot } from "./actions";

const { snapshotMock } = vi.hoisted(() => ({
  snapshotMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("./actions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./actions")>();
  return {
    ...actual,
    dashboardSnapshot: snapshotMock,
  };
});

const mockSnapshot: DashboardSnapshot = {
  role: "governor",
  campusDate: "2026-09-21",
  openSemester: {
    id: "sem-1",
    startDate: "2026-08-15",
    endDate: "2026-12-15",
  },
  ledger: {
    totals: {
      present: 145,
      absent: 18,
      rate: 88.9,
      collected: 900,
    },
    events: [
      {
        eventId: "ev-today",
        name: "CCS General Assembly",
        venue: "Gymnasium",
        date: "2026-09-21",
        type: "whole_day",
        status: "today",
        sessions: [
          { label: "AM", present: 85, incomplete: 5, absent: 10 },
          { label: "PM", present: 80, incomplete: 8, absent: 12 },
        ],
        present: 85,
        incomplete: 5,
        absent: 10,
        rate: 85.0,
        collected: 500,
      },
      {
        eventId: "ev-upcoming",
        name: "Hackathon 2026",
        venue: "Lab 3",
        date: "2026-09-25",
        type: "half_day",
        status: "upcoming",
        sessions: [{ label: "Session", present: 0, incomplete: 0, absent: 0 }],
        present: 0,
        incomplete: 0,
        absent: 0,
        rate: 0.0,
        collected: 0,
      },
      {
        eventId: "ev-past",
        name: "Tech Talk 1",
        venue: "Auditorium",
        date: "2026-09-10",
        type: "half_day",
        status: "past",
        sessions: [{ label: "Session", present: 60, incomplete: 2, absent: 8 }],
        present: 60,
        incomplete: 2,
        absent: 8,
        rate: 85.7,
        collected: 400,
      },
    ],
  },
  governorCounts: {
    officers: 12,
    programs: 4,
  },
  recentScans: [
    {
      id: "scan-1",
      studentName: "Alice Reyes",
      studentIdText: "24-00001",
      timestamp: "10:15 AM",
      status: "present",
      mode: "time_in_am",
    },
    {
      id: "scan-2",
      studentName: "Bob Cruz",
      studentIdText: "24-00002",
      timestamp: "10:18 AM",
      status: "incomplete",
      mode: "time_in_am",
    },
    {
      id: "scan-3",
      studentName: "Charlie Santos",
      studentIdText: "24-00003",
      timestamp: "10:20 AM",
      status: "rejected",
      mode: "time_in_am",
    },
  ],
  pendingSyncCount: 0,
};

function renderDashboard(data: DashboardSnapshot = mockSnapshot) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardView initialData={data} />
    </QueryClientProvider>
  );
}

describe("DashboardView Bento Interface", () => {
  beforeEach(() => {
    snapshotMock.mockResolvedValue(mockSnapshot);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders BentoGrid layout container with asymmetric cell hierarchy", () => {
    renderDashboard();

    const grid = screen.getByTestId("dashboard-bento-grid");
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveAttribute("data-slot", "bento-grid");
    expect(grid.className).toContain("grid");
    expect(grid.className).toContain("min-[900px]:grid-cols-4");

    // Hero 2x2 Cell with hero elevation
    const heroCell = screen.getByTestId("active-session-hero-cell");
    expect(heroCell).toBeInTheDocument();
    expect(heroCell).toHaveAttribute("data-span", "hero");
    expect(heroCell).toHaveAttribute("data-elevation", "hero");

    // Wide 2x1 Cell for Recent Scans
    const recentScansCell = screen.getByTestId("recent-scans-cell");
    expect(recentScansCell).toBeInTheDocument();
    expect(recentScansCell).toHaveAttribute("data-span", "wide");
    expect(recentScansCell).toHaveAttribute("data-elevation", "standard");

    // Tall 1x2 Cell for Real-time Session Counts
    const sessionCountsCell = screen.getByTestId("session-counts-cell");
    expect(sessionCountsCell).toBeInTheDocument();
    expect(sessionCountsCell).toHaveAttribute("data-span", "tall");
    expect(sessionCountsCell).toHaveAttribute("data-elevation", "standard");

    // Small metric cells
    expect(screen.getByTestId("attendance-rate-cell")).toHaveAttribute("data-span", "small");
    expect(screen.getByTestId("semester-window-cell")).toHaveAttribute("data-span", "small");
    expect(screen.getByTestId("total-events-cell")).toHaveAttribute("data-span", "small");
    expect(screen.getByTestId("resolved-sessions-cell")).toHaveAttribute("data-span", "small");

    // 4-column wide operational cells
    expect(screen.getByTestId("all-events-cell")).toBeInTheDocument();
    expect(screen.getByTestId("governor-controls-cell")).toBeInTheDocument();
  });

  it("renders Active Attendance Session check-in status in the Hero cell", () => {
    renderDashboard();

    const heroCell = screen.getByTestId("active-session-hero-cell");
    expect(within(heroCell).getByTestId("active-event-name")).toHaveTextContent("CCS General Assembly");
    expect(within(heroCell).getByText(/Gymnasium/)).toBeInTheDocument();
    expect(within(heroCell).getByText(/Whole-day/i)).toBeInTheDocument();
    expect(within(heroCell).getByTestId("active-event-status-badge")).toHaveTextContent("Live Check-in Open");

    // Quick action button to open attendance
    const openBtn = within(heroCell).getByTestId("open-attendance-button");
    expect(openBtn).toBeInTheDocument();
    expect(openBtn.getAttribute("href")).toBe("/events/ev-today/attendance");
  });

  it("supports event switching to update active session hero and real-time counts", () => {
    renderDashboard();

    // Initial state: today's event "CCS General Assembly"
    expect(screen.getByTestId("active-event-name")).toHaveTextContent("CCS General Assembly");
    expect(screen.getByTestId("realtime-count-present")).toHaveTextContent("85");
    expect(screen.getByTestId("realtime-count-incomplete")).toHaveTextContent("5");
    expect(screen.getByTestId("realtime-count-absent")).toHaveTextContent("10");
    expect(screen.getByTestId("realtime-rate")).toHaveTextContent("85.0%");

    // Event switcher selector
    const eventSwitcher = screen.getByTestId("event-switcher-select");
    expect(eventSwitcher).toBeInTheDocument();

    // Switch to Hackathon 2026
    fireEvent.change(eventSwitcher, { target: { value: "ev-upcoming" } });

    // Hero cell updates to Hackathon 2026
    const heroCell = screen.getByTestId("active-session-hero-cell");
    expect(within(heroCell).getByTestId("active-event-name")).toHaveTextContent("Hackathon 2026");
    expect(within(heroCell).getByText(/Lab 3/)).toBeInTheDocument();
    expect(within(heroCell).getByTestId("open-attendance-button").getAttribute("href")).toBe(
      "/events/ev-upcoming/attendance"
    );

    // Real-time counts update to Hackathon 2026 counts
    expect(screen.getByTestId("realtime-count-present")).toHaveTextContent("0");
    expect(screen.getByTestId("realtime-count-incomplete")).toHaveTextContent("0");
    expect(screen.getByTestId("realtime-count-absent")).toHaveTextContent("0");

    // Switch to Tech Talk 1 (past)
    fireEvent.change(eventSwitcher, { target: { value: "ev-past" } });
    expect(within(heroCell).getByTestId("active-event-name")).toHaveTextContent("Tech Talk 1");
    expect(within(heroCell).getByText(/Auditorium/)).toBeInTheDocument();
    expect(screen.getByTestId("realtime-count-present")).toHaveTextContent("60");
    expect(screen.getByTestId("realtime-count-incomplete")).toHaveTextContent("2");
    expect(screen.getByTestId("realtime-count-absent")).toHaveTextContent("8");
    expect(screen.getByTestId("realtime-rate")).toHaveTextContent("85.7%");
  });

  it("renders Recent Scans feed and offline sync indicators with highlighted rejected scans", () => {
    renderDashboard();

    const scansCell = screen.getByTestId("recent-scans-cell");

    // Offline sync indicator
    const syncBadge = within(scansCell).getByTestId("sync-status-badge");
    expect(syncBadge).toHaveTextContent("Synced · 0 pending");

    // Scan feed items
    const scanItems = within(scansCell).getAllByTestId("recent-scan-item");
    expect(scanItems).toHaveLength(3);

    // Normal present scan
    expect(within(scanItems[0]).getByText("Alice Reyes")).toBeInTheDocument();
    expect(within(scanItems[0]).getByText("(24-00001)")).toBeInTheDocument();
    expect(within(scanItems[0]).getByTestId("scan-status-badge-scan-1")).toHaveTextContent("Present");

    // Normal incomplete scan
    expect(within(scanItems[1]).getByText("Bob Cruz")).toBeInTheDocument();
    expect(within(scanItems[1]).getByTestId("scan-status-badge-scan-2")).toHaveTextContent("Incomplete");

    // Rejected scan prominently highlighted with pink border and hard offset shadow
    const rejectedItem = scanItems[2];
    expect(within(rejectedItem).getByText("Charlie Santos")).toBeInTheDocument();
    expect(within(rejectedItem).getByTestId("scan-status-badge-scan-3")).toHaveTextContent("Rejected");
    expect(rejectedItem.className).toContain("border-[#F9A8B8]");
    expect(rejectedItem.className).toContain("shadow-[4px_4px_0px_0px_#111111]");
  });

  it("displays pending sync indicator when offline queue has items", () => {
    const pendingSnapshot: DashboardSnapshot = {
      ...mockSnapshot,
      pendingSyncCount: 4,
    };
    renderDashboard(pendingSnapshot);

    const syncBadge = screen.getByTestId("sync-status-badge");
    expect(syncBadge).toHaveTextContent("4 pending sync");
  });

  it("renders real-time attendance session counts with high contrast and tabular numbers", () => {
    renderDashboard();

    const countsCell = screen.getByTestId("session-counts-cell");
    const presentEl = within(countsCell).getByTestId("realtime-count-present");
    const incompleteEl = within(countsCell).getByTestId("realtime-count-incomplete");
    const absentEl = within(countsCell).getByTestId("realtime-count-absent");

    expect(presentEl).toHaveTextContent("85");
    expect(presentEl.className).toContain("tabular-nums");
    expect(incompleteEl).toHaveTextContent("5");
    expect(incompleteEl.className).toContain("tabular-nums");
    expect(absentEl).toHaveTextContent("10");
    expect(absentEl.className).toContain("tabular-nums");
  });

  it("collapses responsively on mobile and tablet via BentoGrid classes", () => {
    renderDashboard();

    const grid = screen.getByTestId("dashboard-bento-grid");
    // Mobile (<520px): 1 col, Tablet (>=520px): 2 cols, Desktop (>=900px): 4 cols
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.className).toContain("min-[520px]:grid-cols-2");
    expect(grid.className).toContain("min-[900px]:grid-cols-4");

    const hero = screen.getByTestId("active-session-hero-cell");
    expect(hero.className).toContain("max-[520px]:col-span-1");
    expect(hero.className).toContain("max-[520px]:row-span-1");

    const wide = screen.getByTestId("recent-scans-cell");
    expect(wide.className).toContain("max-[520px]:col-span-1");

    const tall = screen.getByTestId("session-counts-cell");
    expect(tall.className).toContain("max-[520px]:row-span-1");
  });

  it("renders governor controls for governors and hides for officers", () => {
    renderDashboard(mockSnapshot);
    expect(screen.getByTestId("governor-controls-cell")).toBeInTheDocument();
    expect(screen.getByTestId("governor-officers-count")).toHaveTextContent("12");
    expect(screen.getByTestId("governor-programs-count")).toHaveTextContent("4");

    cleanup();

    const officerSnapshot: DashboardSnapshot = {
      ...mockSnapshot,
      role: "officer",
      governorCounts: null,
    };
    renderDashboard(officerSnapshot);
    expect(screen.queryByTestId("governor-controls-cell")).not.toBeInTheDocument();
  });

  it("renders empty state when no semester is open", () => {
    const noSemSnapshot: DashboardSnapshot = {
      ...mockSnapshot,
      openSemester: null,
    };
    renderDashboard(noSemSnapshot);
    expect(screen.getByText("No open Semester")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-bento-grid")).not.toBeInTheDocument();
  });
});
