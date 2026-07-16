import { events, semesters } from "@attendance/db";
import { desc, isNull } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { requireOfficerOrGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import { deriveWholeDayPenalty, EVENT_TYPES } from "@/lib/events";
import { createEvent } from "./actions";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOfficerOrGovernor();
  const { error } = await searchParams;

  const [openSemester, allEvents] = await Promise.all([
    db.query.semesters.findFirst({ where: isNull(semesters.closedAt) }),
    db.select().from(events).orderBy(desc(events.createdAt)),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
      <h1 className="text-xl font-medium">Events</h1>
      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent>
          {allEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">No Events yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Penalty</TableHead>
                  <TableHead className="text-right">Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.name}</TableCell>
                    <TableCell>{event.date}</TableCell>
                    <TableCell>
                      {event.type === "whole_day" ? "Whole-day" : "Half-day"}
                    </TableCell>
                    <TableCell>
                      ₱{event.halfDayPenaltyAmount}/half
                      {event.type === "whole_day" &&
                        ` (₱${deriveWholeDayPenalty(event.halfDayPenaltyAmount)} full absence)`}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="link" size="sm">
                        <Link href={`/events/${event.id}/attendance`}>Attendance</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Event</CardTitle>
        </CardHeader>
        <CardContent>
          {openSemester ? (
            <form action={createEvent} className="flex max-w-sm flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  min={openSemester.startDate}
                  max={openSemester.endDate}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="type">Type</Label>
                <Select name="type" required defaultValue={EVENT_TYPES[0]}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === "whole_day" ? "Whole-day" : "Half-day"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="halfDayPenaltyAmount">Half-day absence penalty (₱)</Label>
                <Input
                  id="halfDayPenaltyAmount"
                  name="halfDayPenaltyAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              <Button type="submit">Create Event</Button>
            </form>
          ) : (
            <p className="text-muted-foreground text-sm">
              No open Semester — ask the Governor to open one before creating Events.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
