"use client";

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
import { markPaid, setScanField } from "./actions";

// Auto-saves the instant a value is picked; the server action re-syncs the
// Penalty and revalidates, so outstanding updates without a Save button. Local
// state gives the dropdown instant feedback while the write is in flight.
function ScanCell({ cell }: { cell: EventGridCell }) {
  const [present, setPresent] = useState(cell.present);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={present ? "present" : "absent"}
      onValueChange={(v) => {
        const next = v === "present";
        setPresent(next);
        setSaved(false);
        startTransition(async () => {
          await setScanField(cell.sessionId, cell.field, next);
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        });
      }}
    >
      <SelectTrigger
        size="sm"
        className={
          present
            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400"
        }
      >
        <SelectValue />
        {pending ? (
          <span className="text-muted-foreground text-xs">…</span>
        ) : saved ? (
          <span className="text-xs text-emerald-600 dark:text-emerald-400">✓</span>
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
                startTransition(() => markPaid(row.unpaidPenaltyIds, eventId))
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
  rows,
}: {
  eventId: string;
  rows: EventGridRow[];
}) {
  const [query, setQuery] = useState("");

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
        onChange={(e) => setQuery(e.target.value)}
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
                  <ScanCell cell={cell} />
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
