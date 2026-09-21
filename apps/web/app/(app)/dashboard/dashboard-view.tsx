"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  BentoCell,
  BentoGrid,
} from "@/components/ui/bento-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { dashboardSnapshot, type DashboardSnapshot } from "./actions";
import { dashboardQueryKey } from "./query-key";
import { RefreshButton } from "./refresh-button";

type EventItem = DashboardSnapshot["ledger"]["events"][number];

function getEventStatusBadgeVariant(status: string): "present" | "incomplete" | "outline" {
  if (status === "today") return "present";
  if (status === "upcoming") return "incomplete";
  return "outline";
}

function getEventStatusLabel(status: string): string {
  if (status === "today") return "Live Check-in Open";
  if (status === "upcoming") return "Scheduled Upcoming";
  return "Past Event";
}

function getScanBadgeVariant(status: string): "present" | "incomplete" | "absent" {
  if (status === "present") return "present";
  if (status === "incomplete") return "incomplete";
  return "absent";
}

function getEventRowBadgeVariant(status: string): "present" | "incomplete" | "secondary" {
  if (status === "today") return "present";
  if (status === "upcoming") return "incomplete";
  return "secondary";
}

function EmptySemesterCard({ role }: Readonly<{ role: string }>) {
  return (
    <Card className="border-2 border-border rounded-[12px] shadow-[var(--shadow-md)] bg-card">
      <CardHeader>
        <CardTitle className="font-heading text-xl font-bold">No open Semester</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <p className="text-muted-foreground font-medium">
          {role === "governor"
            ? "Open a Semester before Officers create Events."
            : "Ask the Governor to open a Semester before starting Event operations."}
        </p>
      </CardContent>
    </Card>
  );
}

function ActiveSessionHeroCell({
  activeEvent,
}: Readonly<{
  activeEvent: EventItem | null;
}>) {
  return (
    <BentoCell
      span="hero"
      elevation="hero"
      overline="BOOTH CHECK-IN"
      title="active attendance session"
      description="Current event session, venue details, and check-in controls."
      data-testid="active-session-hero-cell"
      className="flex flex-col justify-between gap-6"
    >
      {activeEvent ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 rounded-[12px] border-2 border-border bg-card p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0 flex-1">
                <h4
                  data-testid="active-event-name"
                  className="font-heading text-xl sm:text-2xl font-extrabold text-foreground tracking-tight truncate"
                >
                  {activeEvent.name}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{activeEvent.date}</span>
                  {activeEvent.venue && (
                    <>
                      <span>·</span>
                      <span>{activeEvent.venue}</span>
                    </>
                  )}
                  <span>·</span>
                  <span className="font-mono">
                    {activeEvent.type === "whole_day" ? "Whole-day" : "Half-day"}
                  </span>
                </p>
              </div>

              <Badge
                variant={getEventStatusBadgeVariant(activeEvent.status)}
                data-testid="active-event-status-badge"
                className="shadow-[var(--shadow-sm)]"
              >
                {getEventStatusLabel(activeEvent.status)}
              </Badge>
            </div>

            {activeEvent.sessions && activeEvent.sessions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/10">
                {activeEvent.sessions.map((sess) => (
                  <div
                    key={sess.label}
                    className="flex items-center gap-2 rounded-[8px] border-2 border-border bg-[var(--bg-page)] px-3 py-1.5 text-xs font-bold"
                  >
                    <span className="uppercase text-muted-foreground">{sess.label}:</span>
                    <span className="text-emerald-700 font-extrabold">{sess.present} Present</span>
                    <span>·</span>
                    <span className="text-red-600 font-extrabold">{sess.absent} Absent</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              asChild
              variant="default"
              size="lg"
              data-testid="open-attendance-button"
              className="w-full text-base font-bold shadow-[var(--shadow-md)]"
            >
              <Link href={`/events/${activeEvent.eventId}/attendance`}>
                Open Attendance
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4 py-8">
          <p className="text-muted-foreground font-medium">No Events in the open Semester.</p>
          <Button asChild variant="default">
            <Link href="/events#new-event">Create the first Event</Link>
          </Button>
        </div>
      )}
    </BentoCell>
  );
}

function RecentScansFeedCell({
  recentScans,
  pendingSyncCount,
}: Readonly<{
  recentScans: NonNullable<DashboardSnapshot["recentScans"]>;
  pendingSyncCount: number;
}>) {
  return (
    <BentoCell
      span="wide"
      elevation="standard"
      overline="BOOTH FEED"
      title="recent scans & sync status"
      description="Live booth scan stream and offline sync indicator."
      data-testid="recent-scans-cell"
      className="flex flex-col justify-between gap-4"
    >
      <div className="flex items-center justify-between gap-2 pb-1 border-b-2 border-border/10">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#888888]">
          Scanner Booth
        </span>
        <Badge
          variant={pendingSyncCount > 0 ? "incomplete" : "present"}
          data-testid="sync-status-badge"
          className="shadow-[var(--shadow-sm)] gap-1.5"
        >
          <span
            className={cn(
              "size-2 rounded-full",
              pendingSyncCount > 0 ? "bg-amber-800 animate-pulse" : "bg-foreground"
            )}
          />
          {pendingSyncCount > 0 ? `${pendingSyncCount} pending sync` : "Synced · 0 pending"}
        </Badge>
      </div>

      <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[220px]">
        {recentScans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No recent booth scans recorded.
            </p>
          </div>
        ) : (
          recentScans.map((scan) => {
            const isRejected = scan.status === "rejected";
            return (
              <div
                key={scan.id}
                data-testid="recent-scan-item"
                data-status={scan.status}
                className={cn(
                  "flex items-center justify-between gap-3 p-3 rounded-[10px] bg-card transition-all",
                  isRejected
                    ? "border-2 border-[#F9A8B8] shadow-[var(--shadow-md)]"
                    : "border-2 border-border shadow-[var(--shadow-sm)]"
                )}
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-sm font-bold text-foreground truncate">
                      {scan.studentName}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      ({scan.studentIdText})
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {scan.timestamp} {scan.mode ? `· ${scan.mode}` : ""}
                  </span>
                </div>
                <Badge
                  variant={getScanBadgeVariant(scan.status)}
                  data-testid={`scan-status-badge-${scan.id}`}
                  className={cn(
                    "shadow-[var(--shadow-sm)]",
                    isRejected && "bg-[#F9A8B8] text-foreground"
                  )}
                >
                  {scan.status[0].toUpperCase() + scan.status.slice(1)}
                </Badge>
              </div>
            );
          })
        )}
      </div>
    </BentoCell>
  );
}

function RealtimeSessionCountsCell({
  activeEvent,
  ledgerTotals,
}: Readonly<{
  activeEvent: EventItem | null;
  ledgerTotals: DashboardSnapshot["ledger"]["totals"];
}>) {
  const presentCount = activeEvent ? activeEvent.present : ledgerTotals.present;
  const incompleteCount = activeEvent ? activeEvent.incomplete : 0;
  const absentCount = activeEvent ? activeEvent.absent : ledgerTotals.absent;
  const rate = (activeEvent ? activeEvent.rate : ledgerTotals.rate).toFixed(1);

  return (
    <BentoCell
      span="wide"
      elevation="standard"
      overline="REAL-TIME"
      title="session counts"
      description="Verified counts for the active session."
      data-testid="session-counts-cell"
      className="gap-4"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-[10px] border-2 border-border bg-[var(--color-teal)]/20 p-4 shadow-[var(--shadow-sm)]">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
            Present
          </span>
          <span
            data-testid="realtime-count-present"
            className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums"
          >
            {presentCount}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            Verified check-ins
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-[10px] border-2 border-border bg-[var(--color-yellow)]/30 p-4 shadow-[var(--shadow-sm)]">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
            Incomplete
          </span>
          <span
            data-testid="realtime-count-incomplete"
            className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums"
          >
            {incompleteCount}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            Missing in or out
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-[10px] border-2 border-border bg-[var(--color-coral)]/20 p-4 shadow-[var(--shadow-sm)]">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
            Absent
          </span>
          <span
            data-testid="realtime-count-absent"
            className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums"
          >
            {absentCount}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            Liable for penalty
          </span>
        </div>
      </div>

      <div className="rounded-[10px] border-2 border-border bg-card p-3 text-center shadow-[var(--shadow-sm)]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
          Resolved Rate
        </span>
        <span
          data-testid="realtime-rate"
          className="font-heading text-2xl font-extrabold text-foreground tabular-nums"
        >
          {rate}%
        </span>
      </div>
    </BentoCell>
  );
}

function SemesterOverviewCells({
  openSemester,
  ledger,
}: Readonly<{
  openSemester: NonNullable<DashboardSnapshot["openSemester"]>;
  ledger: DashboardSnapshot["ledger"];
}>) {
  return (
    <>
      <BentoCell
        span="small"
        elevation="standard"
        overline="SEMESTER"
        title="overall rate"
        data-testid="attendance-rate-cell"
        className="flex flex-col gap-3 self-start"
      >
        <span className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums">
          {ledger.totals.rate.toFixed(1)}%
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          Overall semester rate
        </span>
      </BentoCell>

      <BentoCell
        span="small"
        elevation="standard"
        overline="CALENDAR"
        title="open semester"
        data-testid="semester-window-cell"
        className="flex flex-col gap-3 self-start"
      >
        <span className="font-heading text-sm sm:text-base font-bold text-foreground">
          {openSemester.startDate}
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          thru {openSemester.endDate}
        </span>
      </BentoCell>

      <BentoCell
        span="small"
        elevation="standard"
        overline="OPERATIONS"
        title="events hosted"
        data-testid="total-events-cell"
        className="flex flex-col gap-3 self-start"
      >
        <span className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums">
          {ledger.events.length}
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          Events scheduled
        </span>
      </BentoCell>

      <BentoCell
        span="small"
        elevation="standard"
        overline="LEDGER"
        title="resolved counts"
        data-testid="resolved-sessions-cell"
        className="flex flex-col gap-3 self-start"
      >
        <div className="flex flex-col gap-0.5">
          <span className="font-heading text-xl font-extrabold text-emerald-700 tabular-nums">
            {ledger.totals.present}{" "}
            <span className="text-xs font-normal text-muted-foreground">present</span>
          </span>
          <span className="font-heading text-xl font-extrabold text-red-600 tabular-nums">
            {ledger.totals.absent}{" "}
            <span className="text-xs font-normal text-muted-foreground">absent</span>
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          ₱{ledger.totals.collected.toFixed(2)} collected
        </span>
      </BentoCell>
    </>
  );
}

function AllSemesterEventsCell({
  events,
}: Readonly<{
  events: DashboardSnapshot["ledger"]["events"];
}>) {
  return (
    <BentoCell
      colSpan={4}
      elevation="standard"
      overline="EVENT ROSTER"
      title="all semester events"
      description="Operational overview of all events scheduled in this semester."
      data-testid="all-events-cell"
      className="col-span-4 max-[900px]:col-span-2 max-[520px]:col-span-1"
    >
      {events.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4">No events scheduled.</p>
      ) : (
        <div className="rounded-[12px] border-2 border-border overflow-hidden bg-card mt-2">
          <Table>
            <TableHeader className="bg-[var(--bg-page)] border-b-2 border-border">
              <TableRow>
                <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                  Event
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                  Status
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                  Date & Venue
                </TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                  Rate
                </TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow
                  key={event.eventId}
                  className="border-b border-border hover:bg-[var(--bg-page)]/50 transition-colors"
                >
                  <TableCell className="font-heading font-bold text-sm text-foreground">
                    {event.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getEventRowBadgeVariant(event.status)}
                      className="shadow-[var(--shadow-sm)]"
                    >
                      {event.status[0].toUpperCase() + event.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {event.date}
                    {event.venue ? ` · ${event.venue}` : ""}
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-sm text-foreground">
                    {event.status === "upcoming" ? "—" : `${event.rate.toFixed(1)}%`}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="shadow-[var(--shadow-sm)]"
                    >
                      <Link href={`/events/${event.eventId}/attendance`}>
                        Open attendance
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </BentoCell>
  );
}

function GovernorControlsCell({
  openSemester,
  governorCounts,
}: Readonly<{
  openSemester: DashboardSnapshot["openSemester"];
  governorCounts: NonNullable<DashboardSnapshot["governorCounts"]>;
}>) {
  return (
    <BentoCell
      colSpan={4}
      elevation="standard"
      overline="GOVERNANCE"
      title="governor controls"
      description="Campus administration and officer oversight controls."
      data-testid="governor-controls-cell"
      className="col-span-4 max-[900px]:col-span-2 max-[520px]:col-span-1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[10px] border-2 border-border bg-card shadow-[var(--shadow-sm)]">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground block">
              Semester
            </span>
            <span className="font-heading text-lg font-bold text-foreground">
              {openSemester ? "Open" : "Closed"}
            </span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground block">
              Officers
            </span>
            <span
              data-testid="governor-officers-count"
              className="font-heading text-lg font-bold text-foreground tabular-nums"
            >
              {governorCounts.officers}
            </span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground block">
              Programs
            </span>
            <span
              data-testid="governor-programs-count"
              className="font-heading text-lg font-bold text-foreground tabular-nums"
            >
              {governorCounts.programs}
            </span>
          </div>
        </div>
        <Button asChild variant="secondary" className="shadow-[var(--shadow-sm)]">
          <Link href="/admin">
            {openSemester ? "Administration" : "Open a Semester"}
          </Link>
        </Button>
      </div>
    </BentoCell>
  );
}

export function DashboardView({ initialData }: Readonly<{ initialData: DashboardSnapshot }>) {
  // Seeded from the server shell, so a cold visit paints rendered HTML and a
  // revisit paints from cache while a background refetch replaces it.
  const { data } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: dashboardSnapshot,
    initialData,
  });
  const { campusDate, openSemester, ledger, governorCounts, role } = data;

  const recentScans = data.recentScans ?? [];
  const pendingSyncCount = data.pendingSyncCount ?? 0;

  // Selected event state for event switching (defaults to today's event or first event)
  const [selectedEventId, setSelectedEventId] = React.useState<string>(() => {
    const today = ledger.events.find((e) => e.status === "today");
    return today?.eventId ?? ledger.events[0]?.eventId ?? "";
  });

  const activeEvent =
    ledger.events.find((e) => e.eventId === selectedEventId) ??
    ledger.events.find((e) => e.status === "today") ??
    ledger.events[0] ??
    null;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 bg-[var(--bg-page)] min-h-[calc(100vh-3rem)]">
      {/* Editorial Header */}
      <header className="flex flex-col justify-between gap-4 border-b-2 border-border pb-5 sm:flex-row sm:items-end">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#888888]">
            CCS Event Operations
          </span>
          <h1 className="font-heading mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground lowercase">
            officer event dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Campus date: <span className="text-foreground font-bold">{campusDate}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {ledger.events.length > 1 && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="event-switcher-select"
                className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground whitespace-nowrap"
              >
                Event:
              </label>
              <select
                id="event-switcher-select"
                aria-label="Select active event"
                data-testid="event-switcher-select"
                value={activeEvent?.eventId ?? ""}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="rounded-[8px] border-2 border-border bg-card px-3 py-1.5 text-xs font-bold shadow-[var(--shadow-sm)] outline-none focus:border-[var(--color-coral)] focus:ring-2 focus:ring-[var(--color-coral)] cursor-pointer"
              >
                {ledger.events.map((event) => (
                  <option key={event.eventId} value={event.eventId}>
                    {event.name} ({event.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          <RefreshButton />
          {openSemester && (
            <Button asChild variant="default" className="shadow-[var(--shadow-md)]">
              <Link href="/events#new-event">New Event</Link>
            </Button>
          )}
        </div>
      </header>

      {!openSemester ? (
        <EmptySemesterCard role={role} />
      ) : (
        <BentoGrid data-testid="dashboard-bento-grid" className="w-full">
          <ActiveSessionHeroCell activeEvent={activeEvent} />
          <RecentScansFeedCell recentScans={recentScans} pendingSyncCount={pendingSyncCount} />
          <RealtimeSessionCountsCell activeEvent={activeEvent} ledgerTotals={ledger.totals} />
          <SemesterOverviewCells openSemester={openSemester} ledger={ledger} />
          <AllSemesterEventsCell events={ledger.events} />
          {governorCounts && (
            <GovernorControlsCell openSemester={openSemester} governorCounts={governorCounts} />
          )}
        </BentoGrid>
      )}
    </main>
  );
}
