// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement scrollIntoView; stub it or opening the Radix Select
// for Event type throws.
Element.prototype.scrollIntoView ??= () => {};

const { updateEventMock, deleteEventMock, eventsSnapshotMock } = vi.hoisted(() => ({
  updateEventMock: vi.fn(),
  deleteEventMock: vi.fn(),
  eventsSnapshotMock: vi.fn(),
}));

vi.mock("./actions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./actions")>();
  return {
    ...actual,
    updateEvent: updateEventMock,
    deleteEvent: deleteEventMock,
    eventsSnapshot: eventsSnapshotMock,
  };
});

import { EventsView } from "./events-view";
import type { EventsSnapshot } from "./actions";

const snapshot: EventsSnapshot = {
  openSemester: { startDate: "2026-08-01", endDate: "2026-12-15" },
  eventTypes: ["whole_day", "half_day"],
  events: [
    {
      id: "ev-1",
      name: "General Assembly",
      date: "2026-09-01",
      type: "half_day",
      halfDayPenaltyAmount: "50",
      wholeDayPenalty: 100,
    },
  ],
};

function renderEvents(client: QueryClient = new QueryClient()) {
  render(
    <QueryClientProvider client={client}>
      <EventsView initialData={snapshot} />
    </QueryClientProvider>,
  );
  return client;
}

beforeEach(() => {
  updateEventMock.mockReset();
  updateEventMock.mockResolvedValue({ error: null });
  deleteEventMock.mockReset();
  eventsSnapshotMock.mockReset();
  eventsSnapshotMock.mockResolvedValue(snapshot);
});

afterEach(() => {
  cleanup();
});

describe("Events row actions render as icon-only bordered buttons (Issue #257)", () => {
  it("exposes Edit, Delete, and Attendance as icon-only buttons with accessible names", () => {
    renderEvents();

    const editButton = screen.getByRole("button", { name: "Edit" });
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    const attendanceLink = screen.getByRole("link", { name: "Attendance" });

    expect(editButton).toBeInTheDocument();
    expect(editButton.textContent).toBe("");
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton.textContent).toBe("");
    expect(attendanceLink).toBeInTheDocument();
    expect(attendanceLink.textContent).toBe("");
  });

  it("still opens the edit dialog when the icon-only Edit button is clicked", async () => {
    renderEvents();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(await screen.findByText("Edit General Assembly")).toBeInTheDocument();
  });

  it("still opens the delete confirmation when the icon-only Delete button is clicked", async () => {
    renderEvents();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Delete General Assembly?")).toBeInTheDocument();
  });

  it("still links to the attendance page from the icon-only Attendance button", () => {
    renderEvents();

    const attendanceLink = screen.getByRole("link", { name: "Attendance" });

    expect(attendanceLink).toHaveAttribute("href", "/events/ev-1/attendance");
  });
});

describe("Event edit confirmation (Issue #222)", () => {
  it("does not save on submit — opens a confirmation naming the change first", async () => {
    renderEvents();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByDisplayValue("General Assembly"), {
      target: { value: "General Assembly (Rescheduled)" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const dialog = await screen.findByText("Save changes to General Assembly?");
    expect(updateEventMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Name → General Assembly \(Rescheduled\)/),
    ).toBeInTheDocument();

    expect(dialog).toBeInTheDocument();
  });

  it("applies the update only after Confirm", async () => {
    renderEvents();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByDisplayValue("General Assembly"), {
      target: { value: "General Assembly (Rescheduled)" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await screen.findByText("Save changes to General Assembly?");
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(updateEventMock).toHaveBeenCalledWith("ev-1", expect.any(FormData)));
  });

  it("leaves the record unchanged when the confirmation is cancelled", async () => {
    renderEvents();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByDisplayValue("General Assembly"), {
      target: { value: "General Assembly (Rescheduled)" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const dialog = await screen.findByRole("alertdialog", {
      name: /Save changes to General Assembly\?/,
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(updateEventMock).not.toHaveBeenCalled();
  });
});

describe("Event mutations invalidate cached queries (Issue #281)", () => {
  it("invalidates the Events and Dashboard caches after an update", async () => {
    const client = renderEvents();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByDisplayValue("General Assembly"), {
      target: { value: "General Assembly (Rescheduled)" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Save changes to General Assembly?");
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["events-snapshot"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["dashboard-snapshot"] });
  });

  it("invalidates the Events and Dashboard caches after a delete", async () => {
    deleteEventMock.mockResolvedValue({ error: null });
    const client = renderEvents();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog", {
      name: /Delete General Assembly\?/,
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["events-snapshot"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["dashboard-snapshot"] });
  });
});
