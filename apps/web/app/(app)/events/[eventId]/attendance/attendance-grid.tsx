"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, usePagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { EventGridCell, EventGridRow } from "@attendance/contracts";
import { useWebStore } from "@/lib/store";
import { eventGrid, markPaid, setScanField } from "./actions";
import { eventGridQueryKey } from "./query-key";

// Auto-saves the instant a sentinel button is clicked; the server action re-syncs the
// Penalty and revalidates, so outstanding updates without a Save button. The
// cell paints the new value optimistically for instant feedback, and a failed
// save rolls the cache back so the Officer sees the correction undo itself
// rather than believing it was recorded (ADR 0013).
function ScanCell({
  cell,
  eventId,
  studentName,
}: {
  cell: EventGridCell;
  eventId: string;
  studentName: string;
}) {
  const queryClient = useQueryClient();
  const queryKey = eventGridQueryKey(eventId);
  // Booth check-in is high-density and rapid (#222): a Present/Absent click
  // asks for confirmation instead of mutating immediately, so a mis-tap
  // doesn't silently flip a record. null = no pending confirmation.
  const [pendingPresent, setPendingPresent] = useState<boolean | null>(null);

  const save = useMutation({
    mutationFn: (present: boolean) => setScanField(cell.sessionId, cell.field, present),
    onMutate: async (present) => {
      // An in-flight refetch would land after the optimistic write and undo it.
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<EventGridRow[]>(queryKey);
      queryClient.setQueryData<EventGridRow[]>(queryKey, (rows) =>
        rows?.map((row) => ({
          ...row,
          cells: row.cells.map((c) =>
            c.sessionId === cell.sessionId && c.field === cell.field
              ? { ...c, present }
              : c,
          ),
        })),
      );
      return { previous };
    },
    onError: (_error, _present, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    // The write also moves the Penalty, so the whole grid is re-read rather
    // than trusting the optimistic cell to have told the whole truth.
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return (
    <>
      <fieldset
        // Present/Absent stack vertically so each session-field column stays
        // narrow enough to fit the viewport without horizontal scrolling (ticket
        // #221). A side-by-side pair of buttons per field made the grid wider
        // than a desktop or tablet can show.
        className="flex flex-col gap-1 border-0 p-0 m-0"
        aria-label={`Attendance status for ${cell.label}`}
      >
        <Button
          type="button"
          size="xs"
          variant={cell.present ? "default" : "ghost"}
          data-active={cell.present}
          aria-pressed={cell.present}
          disabled={save.isPending}
          onClick={() => {
            if (!cell.present) setPendingPresent(true);
          }}
          className={cn(
            "font-bold transition-all text-xs rounded-[6px] select-none",
            cell.present
              ? "bg-[var(--color-teal)] text-foreground border-2 border-border shadow-[var(--shadow-sm)] hover:bg-[var(--color-teal)]/90 hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              : "bg-card text-muted-foreground border-2 border-border opacity-60 hover:opacity-100 hover:text-foreground hover:translate-x-[1px] hover:translate-y-[1px]"
          )}
        >
          Present
        </Button>
        <Button
          type="button"
          size="xs"
          variant={!cell.present ? "destructive" : "ghost"}
          data-active={!cell.present}
          aria-pressed={!cell.present}
          disabled={save.isPending}
          onClick={() => {
            if (cell.present) setPendingPresent(false);
          }}
          className={cn(
            "font-bold transition-all text-xs rounded-[6px] select-none",
            !cell.present
              ? "bg-[var(--color-coral)] text-white border-2 border-border shadow-[var(--shadow-sm)] hover:bg-[var(--color-coral)]/90 hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              : "bg-card text-muted-foreground border-2 border-border opacity-60 hover:opacity-100 hover:text-foreground hover:translate-x-[1px] hover:translate-y-[1px]"
          )}
        >
          Absent
        </Button>
        {save.isPending ? (
          <span className="text-muted-foreground text-xs animate-pulse">…</span>
        ) : save.isError ? (
          <output className="text-xs text-red-600 dark:text-red-400 font-bold">
            Save failed
          </output>
        ) : null}
      </fieldset>
      <AlertDialog
        open={pendingPresent !== null}
        onOpenChange={(open) => {
          if (!open) setPendingPresent(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mark {studentName} {cell.label} {pendingPresent ? "Present" : "Absent"}?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const present = pendingPresent;
                setPendingPresent(null);
                if (present !== null) save.mutate(present);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PaymentCell({ row, eventId }: { row: EventGridRow; eventId: string }) {
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();
  // markPaid's rejections are business-rule messages from the API (e.g. an
  // Officer can't pay off their own Penalty) — shown inline rather than left
  // to throw, which would surface as the segment's generic "can't reach the
  // system" error page regardless of the actual reason.
  const [error, setError] = useState<string | null>(null);

  if (row.settled) return <Badge variant="present" className="shadow-[var(--shadow-sm)]">Paid</Badge>;
  if (row.outstanding === 0) return <span className="text-muted-foreground font-medium">—</span>;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-2">
        <span className="font-bold tabular-nums text-red-600">₱{row.outstanding}</span>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              size="sm"
              disabled={pending}
              className="shadow-[var(--shadow-sm)]"
            >
              Mark paid
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-2 border-border rounded-[12px] bg-card p-6 shadow-[var(--shadow-lg)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-heading text-lg font-bold text-foreground">
                Cash Penalty Payment — {row.name}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Settles every unpaid Penalty {row.name} ({row.studentIdText}) owes for this Event.
                There&apos;s no &quot;unmark paid&quot; action — undoing this means editing the database directly.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Cash Penalty Payment Form */}
            <div className="flex flex-col gap-3 py-2 text-left">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`penalty-due-${row.studentId}`}
                  className="text-xs font-bold uppercase tracking-[0.08em] text-foreground"
                >
                  Penalty Amount Due
                </label>
                <Input
                  id={`penalty-due-${row.studentId}`}
                  readOnly
                  defaultValue={`₱${row.outstanding}`}
                  className="rounded-[8px] border-2 border-border bg-muted/20 px-3 py-2 text-sm font-bold shadow-[var(--shadow-sm)] outline-none transition-all focus:border-[var(--color-coral)] focus:ring-2 focus:ring-[var(--color-coral)]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`cash-tendered-${row.studentId}`}
                  className="text-xs font-bold uppercase tracking-[0.08em] text-foreground"
                >
                  Cash Tendered (₱)
                </label>
                <Input
                  id={`cash-tendered-${row.studentId}`}
                  type="number"
                  defaultValue={row.outstanding}
                  placeholder="Amount received in cash"
                  className="rounded-[8px] border-2 border-border bg-card px-3 py-2 text-sm font-semibold shadow-[var(--shadow-sm)] outline-none transition-all focus:border-[var(--color-coral)] focus:ring-2 focus:ring-[var(--color-coral)]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`receipt-notes-${row.studentId}`}
                  className="text-xs font-bold uppercase tracking-[0.08em] text-foreground"
                >
                  Receipt Reference / Notes
                </label>
                <Input
                  id={`receipt-notes-${row.studentId}`}
                  placeholder="Optional OR number or notes"
                  className="rounded-[8px] border-2 border-border bg-card px-3 py-2 text-sm shadow-[var(--shadow-sm)] outline-none transition-all focus:border-[var(--color-coral)] focus:ring-2 focus:ring-[var(--color-coral)]"
                />
              </div>
            </div>

            <AlertDialogFooter className="border-t-2 border-border bg-[var(--bg-page)] -mx-6 -mb-6 p-4 rounded-b-[10px]">
              <AlertDialogCancel className="border-2 border-border shadow-[var(--shadow-sm)]">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="default"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await markPaid(row.unpaidPenaltyIds, eventId);
                      await queryClient.invalidateQueries({
                        queryKey: eventGridQueryKey(eventId),
                      });
                      setError(null);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Payment couldn't be recorded.");
                    }
                  })
                }
              >
                {pending ? "Recording…" : "Confirm Cash Payment"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {error ? (
        <output className="text-xs text-red-600 dark:text-red-400 font-bold text-right">
          {error}
        </output>
      ) : null}
    </div>
  );
}

export function AttendanceGrid({
  eventId,
  initialRows,
}: {
  eventId: string;
  initialRows: EventGridRow[];
}) {
  // Seeded from the server shell, so a cold visit paints rendered HTML and a
  // revisit paints from cache while a background refetch replaces it.
  const { data: rows } = useQuery({
    queryKey: eventGridQueryKey(eventId),
    queryFn: () => eventGrid(eventId),
    initialData: initialRows,
  });

  const query = useWebStore((s) => s.attendanceSearch[eventId] ?? "");
  const setQuery = useWebStore((s) => s.setAttendanceSearch);

  // Header labels come from the cells themselves — one source of truth for the
  // whole-day (4) vs half-day (2) column shape. rows is non-empty (the page
  // renders a message instead when there are no liable Students).
  const scanColumns = rows[0].cells.map((c) => c.label);

  const q = query.trim().toLowerCase();
  const visible = q
    ? rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) || r.studentIdText.toLowerCase().includes(q),
      )
    : rows;

  const pagination = usePagination(visible);

  return (
    <div className="flex flex-col gap-4 attendance-grid">
      <Input
        placeholder="Search by name or Student ID…"
        value={query}
        onChange={(e) => {
          setQuery(eventId, e.target.value);
          pagination.setPage(1);
        }}
        className="max-w-xs rounded-[8px] border-2 border-border bg-card px-3 py-2 text-sm shadow-[var(--shadow-sm)] outline-none transition-all focus:border-[var(--color-coral)] focus:ring-2 focus:ring-[var(--color-coral)]"
      />
      <div className="rounded-[12px] border-2 border-border bg-card shadow-[var(--shadow-md)] overflow-hidden">
        <Table>
          <TableHeader className="bg-[var(--bg-page)] border-b-2 border-border">
            <TableRow>
              <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                Student
              </TableHead>
              {scanColumns.map((c) => (
                <TableHead key={c} className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                  {c}
                </TableHead>
              ))}
              <TableHead className="text-right text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                Payment
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.pageItems.map((row) => (
              <TableRow
                key={row.studentId}
                className="border-b border-border hover:bg-[var(--bg-page)]/50 transition-colors"
              >
                <TableCell data-label="Student" className="whitespace-normal font-medium text-sm text-foreground">
                  {row.name}{" "}
                  <span className="text-muted-foreground font-mono">({row.studentIdText})</span>
                </TableCell>
                {row.cells.map((cell) => (
                  <TableCell key={`${cell.sessionId}:${cell.field}`} data-label={cell.label}>
                    <ScanCell cell={cell} eventId={eventId} studentName={row.name} />
                  </TableCell>
                ))}
                <TableCell className="text-right" data-label="Payment">
                  <PaymentCell row={row} eventId={eventId} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {visible.length > 0 && (
        <Pagination pagination={pagination} />
      )}
    </div>
  );
}
