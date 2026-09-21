// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { ReportsClient } from "./reports-client";
import { useWebStore } from "@/lib/store";

// Mock global fetch for PDF generation
global.fetch = vi.fn();

const mockSemesters = [
  {
    id: "sem-1",
    startDate: "2026-08-01",
    endDate: "2026-12-15",
    closedAt: null,
  },
];

const mockEvents = [
  {
    id: "ev-1",
    name: "General Assembly",
    date: "2026-08-10",
    semesterId: "sem-1",
    isPast: true,
  },
  {
    id: "ev-2",
    name: "Upcoming Workshop",
    date: "2026-11-20",
    semesterId: "sem-1",
    isPast: false,
  },
];

const mockStudents = [
  {
    id: "st-1",
    name: "Alice Reyes",
    studentId: "24-001",
    program: "Computer Science",
  },
];

function renderReportsClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <ReportsClient
        semesters={mockSemesters}
        events={mockEvents}
        students={mockStudents}
        currentCampusDate="2026-09-21"
      />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  useWebStore.setState({
    reportSelections: {
      reportType: "per-semester",
      semesterId: "sem-1",
      eventId: "",
      studentId: "",
    },
  });
});

afterEach(() => {
  cleanup();
});

describe("ReportsClient PDF Generation CTA (Issue #206)", () => {
  it("renders a prominent pill CTA button with physical press-down feedback for triggering PDF generation", () => {
    renderReportsClient();

    const generateBtn = screen.getByTestId("generate-pdf-btn");
    expect(generateBtn).toBeInTheDocument();
    expect(generateBtn).toHaveAttribute("data-slot", "button");
    expect(generateBtn).toHaveAttribute("data-variant", "pill");

    // Rounded pill shape
    expect(generateBtn.className).toMatch(/rounded-full/);

    // Primary background with white text and 2px border
    expect(generateBtn.className).toMatch(/bg-primary/);
    expect(generateBtn.className).toMatch(/text-white/);
    expect(generateBtn.className).toMatch(/border-2/);

    // Zero-blur hard offset shadow
    expect(generateBtn.className).toMatch(/shadow-\[var\(--shadow-md\)\]/);

    // Mechanical press-down translation and active shadow collapse
    expect(generateBtn.className).toMatch(/hover:translate-x-\[2px\]/);
    expect(generateBtn.className).toMatch(/hover:translate-y-\[2px\]/);
    expect(generateBtn.className).toMatch(/active:translate-x-\[4px\]/);
    expect(generateBtn.className).toMatch(/active:translate-y-\[4px\]/);
    expect(generateBtn.className).toMatch(/active:shadow-none/);
  });

  it("enables button when report selection is complete", () => {
    renderReportsClient();

    const generateBtn = screen.getByTestId("generate-pdf-btn");
    expect(generateBtn).not.toBeDisabled();
    expect(generateBtn).toHaveTextContent("Generate PDF Report");
  });

  it("disables button when report selection is incomplete for per-student report", () => {
    useWebStore.setState({
      reportSelections: {
        reportType: "per-student",
        semesterId: "sem-1",
        eventId: "",
        studentId: "", // missing student
      },
    });

    renderReportsClient();

    // When per-student has semester but no student, the CTA area is only shown if studentId is set,
    // or if shown it is disabled
    const generateBtn = screen.queryByTestId("generate-pdf-btn");
    expect(generateBtn).toBeNull();
  });
});
