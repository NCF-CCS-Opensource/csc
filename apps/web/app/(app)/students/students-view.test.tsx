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

const MODAL_TITLE = "Save changes to Alice Reyes?";

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
  fireEvent.click(screen.getByRole("button", { name: "Edit student" }));
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

  it("shows the confirmation modal even when the correction changes nothing", async () => {
    openCorrection();
    save();

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(MODAL_TITLE)).toBeInTheDocument();
    expect(within(dialog).getByText("No changes to Student ID or Program.")).toBeInTheDocument();
    expect(correctStudentMock).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
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

describe("icon-only edit action (Issue #258)", () => {
  it("renders a bordered icon-only Edit button with no visible label", () => {
    renderStudents();

    const editButton = screen.getByRole("button", { name: "Edit student" });
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveTextContent("");
    expect(screen.queryByRole("button", { name: "Correct" })).not.toBeInTheDocument();
  });

  it("still opens the inline Student ID / Program edit form when clicked", () => {
    renderStudents();

    fireEvent.click(screen.getByRole("button", { name: "Edit student" }));

    expect(screen.getByDisplayValue("24-001")).toBeInTheDocument();
  });
});

describe("Neobrutalist table styling and search filtering (Issue #206)", () => {
  const multiStudentSnapshot: StudentsSnapshot = {
    students: [
      {
        id: "s1",
        name: "Alice Reyes",
        email: "alice@example.edu",
        studentId: "24-001",
        program: "Computer Science",
        role: "student",
      },
      {
        id: "s2",
        name: "Bob Cruz",
        email: "bob@example.edu",
        studentId: "24-002",
        program: "Information Technology",
        role: "officer",
      },
      {
        id: "s3",
        name: "Charlie Tan",
        email: "charlie@example.edu",
        studentId: "24-003",
        program: "Computer Science",
        role: "governor",
      },
    ],
    programs: ["Computer Science", "Information Technology"],
  };

  function renderMulti() {
    const client = new QueryClient();
    return render(
      <QueryClientProvider client={client}>
        <StudentsView initialData={multiStudentSnapshot} />
      </QueryClientProvider>,
    );
  }

  it("renders warm cream table header and 1px row dividers", () => {
    const { container } = renderMulti();

    // Warm cream table header
    const thead = container.querySelector("thead");
    expect(thead).toBeInTheDocument();
    expect(thead?.className).toMatch(/bg-\[var\(--bg-page\)\]|bg-\[#FAFADF\]/);
    expect(thead?.className).toMatch(/border-b-2.*border-border/);

    // 1px row dividers
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(3);
    rows.forEach((row) => {
      expect(row.className).toMatch(/border-b.*border-border\/20/);
    });
  });

  it("renders status pills for roles using Badge component", () => {
    renderMulti();

    // Student role pill
    const s1Badge = screen.getByTestId("role-badge-s1");
    expect(s1Badge).toBeInTheDocument();
    expect(s1Badge).toHaveAttribute("data-slot", "badge");
    expect(s1Badge).toHaveAttribute("data-variant", "secondary");
    expect(s1Badge).toHaveTextContent("Student");

    // Officer role pill
    const s2Badge = screen.getByTestId("role-badge-s2");
    expect(s2Badge).toBeInTheDocument();
    expect(s2Badge).toHaveAttribute("data-slot", "badge");
    expect(s2Badge).toHaveAttribute("data-variant", "default");
    expect(s2Badge).toHaveTextContent("Officer");

    // Governor role pill
    const s3Badge = screen.getByTestId("role-badge-s3");
    expect(s3Badge).toBeInTheDocument();
    expect(s3Badge).toHaveAttribute("data-slot", "badge");
    expect(s3Badge).toHaveAttribute("data-variant", "cleared");
    expect(s3Badge).toHaveTextContent("Governor");
  });

  it("renders search input with Coral search focus offset", () => {
    renderMulti();

    const searchInput = screen.getByRole("textbox", {
      name: /search name, email, or student id/i,
    });
    expect(searchInput.className).toMatch(/focus-visible:ring-\[var\(--color-coral\)\]/);
    expect(searchInput.className).toMatch(/focus-visible:border-\[var\(--color-coral\)\]/);
  });

  it("filters student rows correctly by name, email, and student ID", () => {
    renderMulti();

    expect(screen.getByText("Alice Reyes")).toBeInTheDocument();
    expect(screen.getByText("Bob Cruz")).toBeInTheDocument();
    expect(screen.getByText("Charlie Tan")).toBeInTheDocument();

    const searchInput = screen.getByRole("textbox", {
      name: /search name, email, or student id/i,
    });

    // Search by name
    fireEvent.change(searchInput, { target: { value: "Bob" } });
    expect(screen.queryByText("Alice Reyes")).not.toBeInTheDocument();
    expect(screen.getByText("Bob Cruz")).toBeInTheDocument();
    expect(screen.queryByText("Charlie Tan")).not.toBeInTheDocument();

    // Search by student ID
    fireEvent.change(searchInput, { target: { value: "24-003" } });
    expect(screen.queryByText("Alice Reyes")).not.toBeInTheDocument();
    expect(screen.queryByText("Bob Cruz")).not.toBeInTheDocument();
    expect(screen.getByText("Charlie Tan")).toBeInTheDocument();

    // No matches
    fireEvent.change(searchInput, { target: { value: "nomatch" } });
    expect(screen.getByText("No Students match.")).toBeInTheDocument();
  });
});

describe("Student roster pagination (Issue #218)", () => {
  const paginatedSnapshot: StudentsSnapshot = {
    students: Array.from({ length: 21 }, (_, index) => ({
      id: `s${index + 1}`,
      name: `Student ${index + 1}`,
      email: `student${index + 1}@example.edu`,
      studentId: `24-${String(index + 1).padStart(3, "0")}`,
      program: "Computer Science",
      role: "student" as const,
    })),
    programs: ["Computer Science"],
  };

  function renderPaginated() {
    const client = new QueryClient();
    return render(
      <QueryClientProvider client={client}>
        <StudentsView initialData={paginatedSnapshot} />
      </QueryClientProvider>,
    );
  }

  it("defaults to 20 rows and changes pages and page sizes without reloading", () => {
    renderPaginated();

    expect(screen.getByText("Student 20")).toBeInTheDocument();
    expect(screen.queryByText("Student 21")).not.toBeInTheDocument();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("Student 21")).toBeInTheDocument();
    expect(screen.queryByText("Student 1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("combobox", { name: "Rows per page" }));
    fireEvent.click(screen.getByRole("option", { name: "10 per page" }));
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Student 10")).toBeInTheDocument();
    expect(screen.queryByText("Student 11")).not.toBeInTheDocument();
  });

  it("resets to the first page when filtering the roster", () => {
    renderPaginated();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    fireEvent.change(screen.getByRole("textbox", { name: /search name/i }), {
      target: { value: "Student 1" },
    });

    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
    expect(screen.getByText("Student 1")).toBeInTheDocument();
  });
});
