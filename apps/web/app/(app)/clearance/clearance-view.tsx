"use client";

import * as React from "react";
import { useState, useMemo, useTransition } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { SafLine, SemesterResponse, StudentSummary } from "@attendance/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { markSafFeePaid, voidSafFeePayment } from "./actions";

export interface ClearanceItem {
  student: StudentSummary;
  // null = no Ledger entry (unknown balance) — treated as not cleared.
  outstanding: number | null;
  // The Ledger's SAF Fee line; null or absent when none is owed or unknown.
  saf?: SafLine | null;
}

// Mark paid / Undo for one Student's SAF Fee. The action revalidates the
// page, so the row (and its Clearance badge) updates from the fresh Ledger.
function SafCell({ item, semesterId }: { item: ClearanceItem; semesterId: string | null }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { student, saf } = item;
  if (!saf) return <span className="text-muted-foreground font-medium">—</span>;

  const act = (action: () => Promise<{ error?: string }>) =>
    startTransition(async () => setError((await action()).error ?? null));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {saf.paid ? (
          <Badge variant="present" className="shadow-[var(--shadow-sm)]">Paid</Badge>
        ) : (
          <span className="font-bold tabular-nums text-red-600">₱{saf.amount.toFixed(2)}</span>
        )}
        {saf.paid && saf.paymentId ? (
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={pending}
            aria-label={`Undo ${student.name}'s SAF Fee Payment`}
            onClick={() => act(() => voidSafFeePayment(saf.paymentId!))}
          >
            {pending ? "Undoing…" : "Undo"}
          </Button>
        ) : null}
        {!saf.paid && semesterId ? (
          <Button
            type="button"
            size="xs"
            disabled={pending}
            aria-label={`Mark ${student.name}'s SAF Fee paid`}
            onClick={() => act(() => markSafFeePaid(student.id, semesterId))}
          >
            {pending ? "Recording…" : "Mark paid"}
          </Button>
        ) : null}
      </div>
      {error ? (
        <output className="text-xs text-red-600 dark:text-red-400 font-bold">{error}</output>
      ) : null}
    </div>
  );
}

export interface ClearanceViewProps {
  openSemester: SemesterResponse | null;
  // The Semester whose Ledger produced the balances — the most recently
  // closed one when no Semester is open.
  ledgerSemester?: SemesterResponse | null;
  initialQuery?: string;
  initialResults?: ClearanceItem[];
}

export function ClearanceView({
  openSemester,
  ledgerSemester = null,
  initialQuery = "",
  initialResults = [],
}: Readonly<ClearanceViewProps>) {
  const [query, setQuery] = useState(initialQuery);

  const filteredResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return initialResults;
    return initialResults.filter(
      ({ student }) =>
        student.name.toLowerCase().includes(needle) ||
        student.email.toLowerCase().includes(needle) ||
        student.studentId.toLowerCase().includes(needle),
    );
  }, [initialResults, query]);

  const pagination = usePagination(filteredResults);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 bg-[var(--bg-page)] min-h-[calc(100vh-3rem)]">
      {/* Editorial Header */}
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#888888]">
          CLEARANCE AUDIT & VERIFICATION
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground lowercase">
          clearance verification ledger
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Real-time student ledger settlement verification and official signing clearance audit.
        </p>
      </header>

      {!openSemester && (
        <div
          role="status"
          className="rounded-[10px] border-2 border-border bg-card p-4 shadow-[var(--shadow-sm)]"
        >
          <p className="text-muted-foreground text-sm font-medium">
            {ledgerSemester
              ? `No open Semester — showing unpaid balances from the most recent Semester (${ledgerSemester.startDate} – ${ledgerSemester.endDate}).`
              : "No open Semester — nothing to clear."}
          </p>
        </div>
      )}

{/* Tactile Search Card */}
      <Card className="rounded-[10px] border-2 border-border bg-card p-5 shadow-[var(--shadow-md)]">
        <SearchInput
          value={query}
          onChange={(value) => {
            setQuery(value);
            pagination.setPage(1);
          }}
        />
      </Card>

      {/* Verification Ledger Table Card */}
      <Card className="rounded-[10px] border-2 border-border bg-card shadow-[var(--shadow-md)] overflow-hidden">
        <CardHeader className="border-b-2 border-border bg-[var(--bg-page)] px-6 py-4 flex flex-row items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#888888]">
              LEDGER VERIFICATION
            </span>
            <CardTitle className="font-heading text-lg font-bold text-foreground">
              Results
            </CardTitle>
          </div>
          {filteredResults.length > 0 && (
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full border border-border bg-card text-foreground shadow-[var(--shadow-sm)]">
              {filteredResults.length} student{filteredResults.length === 1 ? "" : "s"}
            </span>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {filteredResults.length === 0 ? (
            <p className="text-muted-foreground text-sm p-6">No results yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[var(--bg-page)] border-b-2 border-border">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                      Student
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                      Student ID
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                      Outstanding Balance
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                      SAF Fee
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                      Clearance Standing
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.pageItems.map((item) => {
                    const { student, outstanding } = item;
                    const isCleared = outstanding === 0;
                    return (
                      <TableRow
                        key={student.id}
                        data-testid={`clearance-row-${student.id}`}
                        className="border-b border-border/20 hover:bg-[var(--bg-page)]/40 transition-colors"
                      >
                        <TableCell className="font-medium text-foreground py-3">
                          <div className="font-bold">{student.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {student.email}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[6px] border border-border bg-[var(--bg-page)] text-foreground">
                            {student.studentId}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-foreground tabular-nums py-3">
                          {outstanding === null ? "—" : `₱${outstanding.toFixed(2)}`}
                        </TableCell>
                        <TableCell className="py-3" data-testid={`clearance-saf-${student.id}`}>
                          <SafCell item={item} semesterId={ledgerSemester?.id ?? null} />
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <Badge
                            variant={isCleared ? "cleared" : "absent"}
                            data-testid={`clearance-badge-${student.id}`}
                            className="gap-1 shadow-[var(--shadow-sm)]"
                          >
                            {isCleared ? (
                              <>
                                <CheckCircle2 className="size-3" />
                                Clearance-ready
                              </>
                            ) : (
                              <>
                                <AlertCircle className="size-3" />
                                Not ready
                              </>
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {filteredResults.length > 0 && (
            <div className="border-t-2 border-border bg-[var(--bg-page)] px-6 py-4">
              <Pagination pagination={pagination} />
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
