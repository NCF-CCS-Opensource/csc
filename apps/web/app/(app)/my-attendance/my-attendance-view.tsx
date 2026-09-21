"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Download, ShieldCheck, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  BentoCell,
  BentoGrid,
} from "@/components/ui/bento-grid";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { myAttendanceSnapshot, type MyAttendanceSnapshot } from "./actions";
import { myAttendanceQueryKey } from "./query-key";

export interface MyAttendanceViewProps {
  initialData: MyAttendanceSnapshot;
}

export function MyAttendanceView({
  initialData,
}: Readonly<MyAttendanceViewProps>) {
  // Seeded from the server shell, so a cold visit paints rendered HTML and a
  // revisit paints from cache while a background refetch replaces it.
  const { data } = useQuery({
    queryKey: myAttendanceQueryKey,
    queryFn: myAttendanceSnapshot,
    initialData,
  });
  const { student, hasOpenSemester, ledger, paymentHistory } = data;
  const { total: totalPenalty, outstanding, sessions: attendanceHistory } = ledger;

  const isCleared = hasOpenSemester && outstanding === 0;

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8 bg-[#FAFADF] min-h-[calc(100vh-3rem)]">
      {/* Editorial Page Header */}
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#888888]">
          STUDENT PORTAL
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111] lowercase">
          my attendance & clearance
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Real-time session audit, computed penalty ledger balance, and official QR pass for {student.name}.
        </p>
      </header>

      {/* Asymmetric 4-Column Bento Grid Layout */}
      <BentoGrid data-testid="attendance-bento-grid" className="w-full">
        {/* Cell 1: Dominant Hero 2x2 Bento Cell with 6px Hard Shadow */}
        <BentoCell
          span="hero"
          elevation="hero"
          overline="ACTIVE LEDGER & CLEARANCE"
          title="penalty ledger & clearance standing"
          description="Current semester penalty balance and clearance sign-off standing."
          data-testid="ledger-hero-cell"
          className="flex flex-col justify-between gap-6"
        >
          {/* Active Balance Display */}
          <div className="flex flex-col gap-3 rounded-[10px] border-2 border-[#111111] bg-white p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground flex items-center gap-1.5">
                <Wallet className="size-4 text-[#111111]" />
                Outstanding Balance
              </span>
              {hasOpenSemester && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full border border-[#111111] bg-[var(--bg-page)] text-[#111111]">
                  Active Semester
                </span>
              )}
            </div>

            {hasOpenSemester ? (
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                <div
                  data-testid="outstanding-balance-amount"
                  className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111111] tabular-nums"
                >
                  ₱{outstanding.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground font-medium sm:text-right">
                  Total penalties accrued:{" "}
                  <span
                    data-testid="total-penalties-amount"
                    className="font-bold text-[#111111] tabular-nums"
                  >
                    ₱{totalPenalty.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2 font-medium">
                No open semester currently active.
              </p>
            )}
          </div>

          {/* Clearance Readiness Card */}
          <div
            data-testid="clearance-readiness-card"
            className={`flex flex-col gap-3 rounded-[10px] border-2 border-[#111111] p-5 transition-all ${
              isCleared
                ? "bg-[var(--color-lavender)]/25 border-[#111111]"
                : hasOpenSemester
                  ? "bg-[var(--color-yellow)]/20 border-[#111111]"
                  : "bg-muted/50 border-[#111111]"
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#111111] flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-[#111111]" />
                Clearance Readiness
              </span>

              {hasOpenSemester ? (
                isCleared ? (
                  <Badge
                    variant="cleared"
                    data-testid="clearance-status-badge"
                    className="gap-1 shadow-[2px_2px_0px_0px_#111111]"
                  >
                    <CheckCircle2 className="size-3" />
                    Cleared & Ready
                  </Badge>
                ) : (
                  <Badge
                    variant="absent"
                    data-testid="clearance-status-badge"
                    className="gap-1 shadow-[2px_2px_0px_0px_#111111]"
                  >
                    <AlertCircle className="size-3" />
                    Action Required • Pending
                  </Badge>
                )
              ) : (
                <Badge
                  variant="outline"
                  data-testid="clearance-status-badge"
                  className="shadow-[2px_2px_0px_0px_#111111]"
                >
                  No open semester
                </Badge>
              )}
            </div>

            <p className="text-xs sm:text-sm text-foreground leading-relaxed">
              {hasOpenSemester ? (
                isCleared ? (
                  "All attendance requirements are satisfied and your penalty balance is zero. You are eligible for end-of-semester officer clearance sign-off."
                ) : (
                  `Please settle your outstanding balance of ₱${outstanding.toFixed(
                    2
                  )} with the council treasurer to unlock your official clearance sign-off.`
                )
              ) : (
                "No open semester is currently accepting clearance submissions."
              )}
            </p>
          </div>
        </BentoCell>

        {/* Cell 2: Digital and Printable QR Card (High-contrast container with distinct borders) */}
        <BentoCell
          span="2x2"
          elevation="standard"
          overline="DIGITAL PASS"
          title="student qr pass"
          description="High-contrast digital credential for scanner booth check-ins."
          data-testid="qr-card-cell"
          className="flex flex-col justify-between gap-4"
        >
          {/* High-contrast container with distinct borders */}
          <div
            data-testid="qr-code-container"
            className="flex flex-col items-center gap-4 rounded-[10px] border-2 border-[#111111] bg-white p-5 shadow-[var(--shadow-sm)] w-full"
          >
            {/* Student ID strip */}
            <div className="w-full flex items-center justify-between border-b-2 border-[#111111] pb-3">
              <div>
                <h4 className="font-heading text-base font-bold text-[#111111]">
                  {student.name}
                </h4>
                <p className="text-xs text-muted-foreground">{student.program}</p>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-[6px] border-2 border-[#111111] bg-[var(--bg-page)] text-[#111111] shadow-[2px_2px_0px_0px_#111111]">
                {student.studentId}
              </span>
            </div>

            {/* High-contrast QR image box for fast camera scanning */}
            <div className="flex items-center justify-center p-3 rounded-[8px] border-2 border-[#111111] bg-white shadow-[2px_2px_0px_0px_#111111]">
              {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG, not an optimizable static asset */}
              <img
                src="/qr"
                alt="Your attendance QR code"
                width={180}
                height={180}
                className="aspect-square object-contain"
              />
            </div>

            <div className="text-center text-xs text-muted-foreground font-mono">
              {student.email}
            </div>
          </div>

          {/* Download CTA Button */}
          <Button asChild variant="primary" className="w-full">
            <a href="/qr/card" download="qr-card.pdf">
              <Download className="size-4 mr-2" />
              Download QR Card
            </a>
          </Button>
        </BentoCell>

        {/* Cell 3: Attendance Session History Wide Bento Cell */}
        <BentoCell
          span="wide"
          elevation="standard"
          overline="SESSION AUDIT"
          title="attendance session history"
          description="Verified event attendance records and check-in statuses."
          data-testid="attendance-history-cell"
        >
          {attendanceHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6">
              No attendance recorded yet.
            </p>
          ) : (
            <div className="rounded-[8px] border-2 border-[#111111] overflow-hidden bg-white mt-2">
              <Table>
                <TableHeader className="bg-[var(--bg-page)] border-b-2 border-[#111111]">
                  <TableRow>
                    <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">
                      Event
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceHistory.map((row) => (
                    <TableRow
                      key={`${row.eventId}:${row.half}`}
                      className="border-b border-[#111111] hover:bg-[var(--bg-page)]/50 transition-colors"
                    >
                      <TableCell className="font-medium text-sm text-[#111111]">
                        {row.eventName}{" "}
                        <span className="text-xs font-mono text-muted-foreground font-semibold">
                          ({row.half.toUpperCase()})
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            row.status === "present"
                              ? "present"
                              : row.status === "incomplete"
                                ? "incomplete"
                                : "absent"
                          }
                          data-testid={`status-badge-${row.eventId}-${row.half}`}
                          className="shadow-[2px_2px_0px_0px_#111111]"
                        >
                          {row.status[0].toUpperCase() + row.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </BentoCell>

        {/* Cell 4: Payment History Wide Bento Cell */}
        <BentoCell
          span="wide"
          elevation="standard"
          overline="TRANSACTION RECORD"
          title="penalty payment history"
          description="Audited ledger payments and settlement receipts."
          data-testid="payment-history-cell"
        >
          {paymentHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6">
              No payments yet.
            </p>
          ) : (
            <div className="rounded-[8px] border-2 border-[#111111] overflow-hidden bg-white mt-2">
              <Table>
                <TableHeader className="bg-[var(--bg-page)] border-b-2 border-[#111111]">
                  <TableRow>
                    <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">
                      Date
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">
                      Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow
                      key={payment.id}
                      className="border-b border-[#111111] hover:bg-[var(--bg-page)]/50 transition-colors"
                    >
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {payment.paidOn}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-sm text-[#111111]">
                        ₱{payment.amount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </BentoCell>
      </BentoGrid>
    </main>
  );
}
