"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardSnapshot, type DashboardSnapshot } from "./actions";
import { dashboardQueryKey } from "./query-key";
import { RefreshButton } from "./refresh-button";

export function DashboardView({ initialData }: { initialData: DashboardSnapshot }) {
  // Seeded from the server shell, so a cold visit paints rendered HTML and a
  // revisit paints from cache while a background refetch replaces it.
  const { data } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: dashboardSnapshot,
    initialData,
  });
  const { campusDate, openSemester, ledger, governorCounts, role } = data;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
            CCS Event Operations
          </p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Campus date: {campusDate}
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton />
          {openSemester && (
            <Button asChild>
              <Link href="/events#new-event">New Event</Link>
            </Button>
          )}
        </div>
      </header>

      {!openSemester ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">No open Semester</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            <p className="text-muted-foreground">
              {role === "governor"
                ? "Open a Semester before Officers create Events."
                : "Ask the Governor to open a Semester before starting Event operations."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <section aria-label="Semester overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Open Semester" value={`${openSemester.startDate} — ${openSemester.endDate}`} />
            <Metric label="Events" value={String(ledger.events.length)} />
            <Metric
              label="Resolved Sessions"
              value={`${ledger.totals.present} present · ${ledger.totals.absent} absent`}
            />
            <Metric label="Attendance Rate" value={`${ledger.totals.rate.toFixed(1)}%`} />
          </section>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="font-display text-xl">Event operations</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {ledger.events.length === 0 ? (
                <div className="flex flex-col items-start gap-3 px-4 py-8">
                  <p className="text-muted-foreground">No Events in the open Semester.</p>
                  <Button asChild>
                    <Link href="/events#new-event">Create the first Event</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {ledger.events.map((event) => (
                    <article
                      key={event.eventId}
                      className="grid gap-4 px-4 py-5 lg:grid-cols-[minmax(12rem,1fr)_minmax(20rem,2fr)_7rem_9rem] lg:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate font-medium">{event.name}</h2>
                          <Badge
                            variant={
                              event.status === "today"
                                ? "default"
                                : event.status === "past"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {event.status[0].toUpperCase() + event.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {event.date}
                          {event.venue ? ` · ${event.venue}` : ""}
                          {" · "}
                          {event.type === "whole_day" ? "Whole-day" : "Half-day"}
                        </p>
                      </div>

                      {event.status === "upcoming" ? (
                        <p className="text-muted-foreground text-sm">
                          Attendance counts will appear on the Event date.
                        </p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {event.sessions.map((session) => (
                            <div
                              key={session.label}
                              className="overflow-hidden rounded-lg border bg-muted/20"
                            >
                              <div className="border-b px-3 py-1.5 text-xs font-semibold uppercase">
                                {session.label}
                              </div>
                              <dl className="grid grid-cols-3 text-center text-xs">
                                <Band value={session.present} label="Present" className="text-primary" />
                                <Band value={session.incomplete} label="Incomplete" className="text-amber-700 dark:text-amber-300" />
                                <Band value={session.absent} label="Absent" className="text-destructive" />
                              </dl>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="lg:text-right">
                        {event.status !== "upcoming" && (
                          <>
                            <p className="font-display text-2xl font-semibold">
                              {event.rate.toFixed(1)}%
                            </p>
                            <p className="text-muted-foreground text-xs">resolved rate</p>
                          </>
                        )}
                      </div>

                      <div className="lg:text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/events/${event.eventId}/attendance`}>
                            Open attendance
                          </Link>
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {governorCounts && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="font-display text-xl">Governor Controls</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <dl className="grid flex-1 grid-cols-3 gap-4 text-sm">
              <GovernorCount label="Semester" value={openSemester ? "Open" : "Not open"} />
              <GovernorCount label="Officers" value={String(governorCounts.officers)} />
              <GovernorCount label="Programs" value={String(governorCounts.programs)} />
            </dl>
            <Button asChild variant="secondary">
              <Link href="/admin">
                {openSemester ? "Administration" : "Open a Semester"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="font-display text-xl font-semibold">{value}</CardContent>
    </Card>
  );
}

function Band({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className: string;
}) {
  return (
    <div className="border-r px-1 py-2 last:border-r-0">
      <dt className="text-muted-foreground text-[0.65rem]">{label}</dt>
      <dd className={`mt-0.5 font-semibold ${className}`}>{value}</dd>
    </div>
  );
}

function GovernorCount({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-display mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}
