"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { AlertCircle, CheckCircle2, Search } from "lucide-react";
import type { SemesterResponse, StudentSummary } from "@attendance/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ClearanceItem {
  student: StudentSummary;
  outstanding: number;
}

export interface ClearanceViewProps {
  openSemester: SemesterResponse | null;
  initialQuery?: string;
  initialResults?: ClearanceItem[];
}

export function ClearanceView({
  openSemester,
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
          className="rounded-[10px] border-2 border-[#111111] bg-white p-4 shadow-[var(--shadow-sm)]"
        >
          <p className="text-muted-foreground text-sm font-medium">
            No open Semester — nothing to clear.
          </p>
        </div>
      )}

      {/* Tactile Search Form Card */}
      <Card className="rounded-[10px] border-2 border-[#111111] bg-white p-5 shadow-[var(--shadow-md)]">
        <form method="GET" className="flex flex-col sm:flex-row gap-3">
          <Input
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, or student ID"
            aria-label="Search name, email, or student ID"
            className="flex-1 border-2 border-[#111111] rounded-[8px] bg-white focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:border-[var(--color-coral)] shadow-[var(--shadow-sm)]"
          />
          <Button type="submit" variant="default" className="shrink-0 font-bold">
            <Search className="size-4 mr-1.5" />
            Search
          </Button>
        </form>
      </Card>

      {/* Verification Ledger Table Card */}
      <Card className="rounded-[10px] border-2 border-[#111111] bg-white shadow-[var(--shadow-md)] overflow-hidden">
        <CardHeader className="border-b-2 border-[#111111] bg-[var(--bg-page)] px-6 py-4 flex flex-row items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#888888]">
              LEDGER VERIFICATION
            </span>
            <CardTitle className="font-heading text-lg font-bold text-[#111111]">
              Results
            </CardTitle>
          </div>
          {filteredResults.length > 0 && (
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full border border-[#111111] bg-white text-[#111111] shadow-[var(--shadow-sm)]">
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
                <TableHeader className="bg-[var(--bg-page)] border-b-2 border-[#111111]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">
                      Student
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">
                      Student ID
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">
                      Outstanding Balance
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">
                      Clearance Standing
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map(({ student, outstanding }) => {
                    const isCleared = outstanding === 0;
                    return (
                      <TableRow
                        key={student.id}
                        data-testid={`clearance-row-${student.id}`}
                        className="border-b border-[#111111]/20 hover:bg-[var(--bg-page)]/40 transition-colors"
                      >
                        <TableCell className="font-medium text-foreground py-3">
                          <div className="font-bold">{student.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {student.email}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[6px] border border-[#111111] bg-[var(--bg-page)] text-[#111111]">
                            {student.studentId}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-foreground tabular-nums py-3">
                          ₱{outstanding.toFixed(2)}
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
        </CardContent>
      </Card>
    </main>
  );
}
