// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Radix Select scrolls the highlighted option into view on open; jsdom has no
// scrollIntoView, so stub it or the Program interaction throws.
Element.prototype.scrollIntoView ??= () => {};

const { correctStudentMock, snapshotMock } = vi.hoisted(() => ({
  correctStudentMock: vi.fn(),
  snapshotMock: vi.fn(),
}));

vi.mock("./actions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./actions")>();
  return {
    ...actual,
    correctStudent: correctStudentMock,
    studentsSnapshot: snapshotMock,
  };
});

import { StudentsView } from "./students-view";
import type { StudentsSnapshot } from "./actions";

const snapshot: StudentsSnapshot = {
  students: [
    {
      id: "s1",
      name: "Alice Reyes",
      email: "alice@example.edu",
      studentId: "24-001",
      program: "Computer Science",
      role: "student",
    },
  ],
  programs: ["Computer Science", "Information Technology"],
};

const MODAL_TITLE = "This correction invalidates Alice Reyes's printed QR Card";

function renderStudents() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <StudentsView initialData={snapshot} />
    </QueryClientProvider>,
  );
}

function openCorrection() {
  renderStudents();
  fireEvent.click(screen.getByRole("button", { name: "Correct" }));
}

function changeId(id: string) {
  fireEvent.change(screen.getByDisplayValue("24-001"), { target: { value: id } });
}

function changeProgram() {
  // The row's Program select currently shows "Computer Science" (the toolbar
  // filter shows "All Programs"). Open it, then pick the other Program.
  fireEvent.click(screen.getByText("Computer Science"));
  fireEvent.click(screen.getByText("Information Technology"));
}

function save() {
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
}

async function openDialogByChangingId(id: string) {
  openCorrection();
  changeId(id);
  save();
  return await screen.findByRole("alertdialog");
}

beforeEach(() => {
  correctStudentMock.mockReset();
  correctStudentMock.mockResolvedValue({ errors: [] });
  snapshotMock.mockReset();
  snapshotMock.mockResolvedValue(snapshot);
});

afterEach(() => {
  cleanup();
});

describe("QR Card invalidation confirmation (spec #143)", () => {
  it("shows the confirmation modal before applying a Student ID correction", async () => {
    openCorrection();
    changeId("24-002");
    save();

    expect(await screen.findByText(MODAL_TITLE)).toBeInTheDocument();
    // The modal names the consequence: the card no longer matches and will be
    // rejected at Scan Approval. Confirming alone applies it — no immediate write.
    expect(screen.getByText(/will be rejected at Scan Approval/)).toBeInTheDocument();
    expect(correctStudentMock).not.toHaveBeenCalled();
  });

  it("shows the confirmation modal before applying a Program-only correction", async () => {
    openCorrection();
    changeProgram();
    save();

    expect(await screen.findByText(MODAL_TITLE)).toBeInTheDocument();
    expect(correctStudentMock).not.toHaveBeenCalled();
  });

  it("does not show the modal when the correction changes nothing", async () => {
    openCorrection();
    save();

    expect(screen.queryByText(MODAL_TITLE)).not.toBeInTheDocument();
    await waitFor(() =>
      expect(correctStudentMock).toHaveBeenCalledWith("s1", {
        studentId: "24-001",
        program: "Computer Science",
      }),
    );
  });

  it("applies the correction immediately when the Officer confirms", async () => {
    const dialog = await openDialogByChangingId("24-002");
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(correctStudentMock).toHaveBeenCalledWith("s1", {
        studentId: "24-002",
        program: "Computer Science",
      }),
    );
  });

  it("leaves the Student record unchanged if the Officer cancels", async () => {
    const dialog = await openDialogByChangingId("24-002");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(correctStudentMock).not.toHaveBeenCalled();
  });
});
