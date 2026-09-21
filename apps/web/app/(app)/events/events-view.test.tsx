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

function renderEvents() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <EventsView initialData={snapshot} />
    </QueryClientProvider>,
  );
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
