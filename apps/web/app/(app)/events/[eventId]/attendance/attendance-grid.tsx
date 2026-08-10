"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EventGridCell, EventGridRow } from "@/lib/ledger";
import { useWebStore } from "@/lib/store";
import { eventGrid, markPaid, setScanField } from "./actions";
import { eventGridQueryKey } from "./query-key";

// Auto-saves the instant a value is picked; the server action re-syncs the
// Penalty and revalidates, so outstanding updates without a Save button. The
// cell paints the new value optimistically for instant feedback, and a failed
// save rolls the cache back so the Officer sees the correction undo itself
// rather than believing it was recorded (ADR 0013).
function ScanCell({ cell, eventId }: { cell: EventGridCell; eventId: string }) {
  const queryClient = useQueryClient();
  const queryKey = eventGridQueryKey(eventId);

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
    <Select
      value={cell.present ? "present" : "absent"}
      onValueChange={(v) => save.mutate(v === "present")}
    >
      <SelectTrigger
        size="sm"
        className={
          cell.present
            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400"
        }
      >
        <SelectValue />
        {save.isPending ? (
          <span className="text-muted-foreground text-xs">…</span>
        ) : save.isError ? (
          <span className="text-xs text-red-600 dark:text-red-400" role="status">
            Save failed
          </span>
        ) : null}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="present">Present</SelectItem>
        <SelectItem value="absent">Absent</SelectItem>
      </SelectContent>
    </Select>
  );
}

function PaymentCell({ row, eventId }: { row: EventGridRow; eventId: string }) {
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();

  if (row.settled) return <Badge variant="default">Paid</Badge>;
  if (row.outstanding === 0) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="flex items-center justify-end gap-2">
      <span className="font-medium text-red-600 dark:text-red-400">₱{row.outstanding}</span>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" size="sm" disabled={pending}>
            Mark paid
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark ₱{row.outstanding} as paid?</AlertDialogTitle>
            <AlertDialogDescription>
              Settles every unpaid Penalty {row.name} owes for this Event. There&apos;s no
              &quot;unmark paid&quot; action — undoing this means editing the database directly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                startTransition(async () => {
                  await markPaid(row.unpaidPenaltyIds, eventId);
                  // Two caches now: revalidatePath alone leaves the grid's
                  // cached balance showing the amount just settled.
                  await queryClient.invalidateQueries({
                    queryKey: eventGridQueryKey(eventId),
                  });
                })
              }
            >
              Mark paid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search by name or Student ID…"
        value={query}
        onChange={(e) => setQuery(eventId, e.target.value)}
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            {scanColumns.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
            <TableHead className="text-right">Payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((row) => (
            <TableRow key={row.studentId}>
              <TableCell className="whitespace-nowrap">
                {row.name}{" "}
                <span className="text-muted-foreground">({row.studentIdText})</span>
              </TableCell>
              {row.cells.map((cell) => (
                <TableCell key={`${cell.sessionId}:${cell.field}`}>
                  <ScanCell cell={cell} eventId={eventId} />
                </TableCell>
              ))}
              <TableCell className="text-right">
                <PaymentCell row={row} eventId={eventId} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
