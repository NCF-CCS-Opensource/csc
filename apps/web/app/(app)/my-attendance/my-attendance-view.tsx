"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Download, ShieldCheck, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  BentoCell,
  BentoGrid,
} from "@/components/ui/bento-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination, usePagination } from "@/components/ui/pagination";
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
import { myAttendanceSnapshot, type MyAttendanceSnapshot } from "./actions";
import { myAttendanceQueryKey } from "./query-key";

const ALL_STATUSES = "__all__";

type AttendanceStatus = MyAttendanceSnapshot["ledger"]["sessions"][number]["status"];

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

  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | typeof ALL_STATUSES>(
    ALL_STATUSES
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredHistory = useMemo(() => {
    return attendanceHistory.filter((row) => {
      const matchesStatus = statusFilter === ALL_STATUSES || row.status === statusFilter;
      const matchesFrom = dateFrom === "" || row.eventDate >= dateFrom;
      const matchesTo = dateTo === "" || row.eventDate <= dateTo;
      return matchesStatus && matchesFrom && matchesTo;
    });
  }, [attendanceHistory, statusFilter, dateFrom, dateTo]);
  const historyPagination = usePagination(filteredHistory);

  const isCleared = hasOpenSemester && outstanding === 0;

  // Consolidate clearance status configuration into a single declarative state
  const clearanceConfig = !hasOpenSemester
    ? {
        variant: "outline" as const,
        badgeText: "No open semester",
        badgeIcon: null,
        cardBg: "bg-muted/50",
        description: "No open semester is currently accepting clearance submissions.",
      }
    : isCleared
      ? {
          variant: "cleared" as const,
          badgeText: "Cleared & Ready",
          badgeIcon: CheckCircle2,
          cardBg: "bg-[var(--color-lavender)]/25",
          description:
            "All attendance requirements are satisfied and your penalty balance is zero. You are eligible for end-of-semester officer clearance sign-off.",
        }
      : {
          variant: "absent" as const,
          badgeText: "Action Required • Pending",
          badgeIcon: AlertCircle,
          cardBg: "bg-[var(--color-yellow)]/20",
          description: `Please settle your outstanding balance of ₱${outstanding.toFixed(
            2
          )} with the council treasurer to unlock your official clearance sign-off.`,
        };

  const ClearanceIcon = clearanceConfig.badgeIcon;

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8 bg-[var(--bg-page)] min-h-[calc(100vh-3rem)]">
      {/* Editorial Page Header */}
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#888888]">
          STUDENT PORTAL
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground lowercase">
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
          <div className="flex flex-col gap-3 rounded-[12px] border-2 border-border bg-card p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground flex items-center gap-1.5">
                <Wallet className="size-4 text-foreground" />
                Outstanding Balance
              </span>
              {hasOpenSemester && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full border border-border bg-[var(--bg-page)] text-foreground">
                  Active Semester
                </span>
              )}
            </div>

            {hasOpenSemester ? (
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                <div
                  data-testid="outstanding-balance-amount"
                  className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground tabular-nums"
                >
                  ₱{outstanding.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground font-medium sm:text-right">
                  {ledger.saf ? "Total charged" : "Total penalties accrued"}:{" "}
                  <span
                    data-testid="total-penalties-amount"
                    className="font-bold text-foreground tabular-nums"
                  >
                    ₱{totalPenalty.toFixed(2)}
                  </span>
                  {ledger.saf ? (
                    <div data-testid="saf-fee-line">
                      incl. SAF Fee ₱{ledger.saf.amount.toFixed(2)} ({ledger.saf.paid ? "paid" : "unpaid"})
                    </div>
                  ) : null}
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
            className={`flex flex-col gap-3 rounded-[12px] border-2 border-border p-5 transition-all ${clearanceConfig.cardBg}`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-foreground" />
                Clearance Readiness
              </span>

              <Badge
                variant={clearanceConfig.variant}
                data-testid="clearance-status-badge"
                className="gap-1 shadow-[var(--shadow-sm)]"
              >
                {ClearanceIcon && <ClearanceIcon className="size-3" />}
                {clearanceConfig.badgeText}
              </Badge>
            </div>

            <p className="text-xs sm:text-sm text-foreground leading-relaxed">
              {clearanceConfig.description}
            </p>
          </div>
        </BentoCell>

        {/* Cell 2: Digital and Printable QR Card (Wide 2x1 Bento Cell with distinct borders) */}
        <BentoCell
          span="wide"
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
            className="flex flex-col sm:flex-row items-center gap-5 rounded-[12px] border-2 border-border bg-card p-5 shadow-[var(--shadow-sm)] w-full"
          >
            {/* High-contrast QR image box for fast camera scanning */}
            <div className="shrink-0 flex items-center justify-center p-3 rounded-[10px] border-2 border-border bg-card shadow-[var(--shadow-sm)]">
              {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG, not an optimizable static asset */}
              <img
                src="/qr"
                alt="Your attendance QR code"
                width={130}
                height={130}
                className="aspect-square object-contain"
              />
            </div>

            {/* Student ID strip & download CTA */}
            <div className="flex flex-1 flex-col justify-between gap-3 w-full text-center sm:text-left">
              <div>
                <div className="flex items-center justify-center sm:justify-between gap-2 flex-wrap">
                  <h4 className="font-heading text-base font-bold text-foreground">
                    {student.name}
                  </h4>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[6px] border-2 border-border bg-[var(--bg-page)] text-foreground shadow-[var(--shadow-sm)]">
                    {student.studentId}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{student.program}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{student.email}</p>
              </div>

              {/* Download CTA Button using pill variant */}
              <Button asChild variant="pill" className="w-full">
                <a href="/qr/card" download="qr-card.pdf">
                  <Download className="size-4 mr-2" />
                  Download QR Card
                </a>
              </Button>
            </div>
          </div>
        </BentoCell>

        {/* Cell 3: Payment History Wide 2x1 Bento Cell */}
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
            <div className="rounded-[12px] border-2 border-border overflow-hidden bg-card mt-2">
              <Table>
                <TableHeader className="bg-[var(--bg-page)] border-b-2 border-border">
                  <TableRow>
                    <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                      Date
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                      Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow
                      key={payment.id}
                      className="border-b border-border hover:bg-[var(--bg-page)]/50 transition-colors"
                    >
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {payment.paidOn}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-sm text-foreground">
                        ₱{payment.amount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </BentoCell>

        {/* Cell 4: Attendance Session History Wide Bento Cell */}
        <BentoCell
          span="wide"
          colSpan={4}
          elevation="standard"
          overline="SESSION AUDIT"
          title="attendance session history"
          description="Verified event attendance records and check-in statuses."
          data-testid="attendance-history-cell"
          className="col-span-4 max-[900px]:col-span-2 max-[520px]:col-span-1"
        >
          {attendanceHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6">
              No attendance recorded yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex flex-col gap-1.5 sm:w-48">
                  <Label htmlFor="attendance-status-filter">Status</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value as AttendanceStatus | typeof ALL_STATUSES);
                      historyPagination.setPage(1);
                    }}
                  >
                    <SelectTrigger
                      id="attendance-status-filter"
                      aria-label="Filter by status"
                      className="border-2 border-border rounded-[8px] bg-card shadow-[var(--shadow-sm)]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_STATUSES}>All Statuses</SelectItem>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="incomplete">Incomplete</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="attendance-date-from">From</Label>
                  <Input
                    id="attendance-date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      historyPagination.setPage(1);
                    }}
                    className="border-2 border-border rounded-[8px] bg-card shadow-[var(--shadow-sm)]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="attendance-date-to">To</Label>
                  <Input
                    id="attendance-date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      historyPagination.setPage(1);
                    }}
                    className="border-2 border-border rounded-[8px] bg-card shadow-[var(--shadow-sm)]"
                  />
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6">
                  No attendance records match the selected filters.
                </p>
              ) : (
                <>
                  <div className="rounded-[12px] border-2 border-border overflow-hidden bg-card">
                    <Table>
                      <TableHeader className="bg-[var(--bg-page)] border-b-2 border-border">
                        <TableRow>
                          <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                            Event
                          </TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                            Date
                          </TableHead>
                          <TableHead className="text-right text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyPagination.pageItems.map((row) => (
                          <TableRow
                            key={`${row.eventId}:${row.half}`}
                            className="border-b border-border hover:bg-[var(--bg-page)]/50 transition-colors"
                          >
                            <TableCell className="font-medium text-sm text-foreground">
                              {row.eventName}{" "}
                              <span className="text-xs font-mono text-muted-foreground font-semibold">
                                ({row.half.toUpperCase()})
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {row.eventDate}
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
                                className="shadow-[var(--shadow-sm)]"
                              >
                                {row.status[0].toUpperCase() + row.status.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination pagination={historyPagination} />
                </>
              )}
            </div>
          )}
        </BentoCell>
      </BentoGrid>
    </main>
  );
}
