"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
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
import {
  createEvent,
  deleteEvent,
  eventsSnapshot,
  updateEvent,
  type EventsSnapshot,
} from "./actions";
import { eventsQueryKey } from "./query-key";

type EventRow = EventsSnapshot["events"][number];

export function EventsView({
  initialData,
  error,
}: {
  initialData: EventsSnapshot;
  error?: string;
}) {
  const queryClient = useQueryClient();

  // Seeded from the server shell, so a cold visit paints rendered HTML and a
  // revisit paints from cache while a background refetch replaces it.
  const { data } = useQuery({
    queryKey: eventsQueryKey,
    queryFn: eventsSnapshot,
    initialData,
  });

  // createEvent redirects back here, so the shell re-reads and hands down a
  // payload newer than anything cached. Without this the cache would win and a
  // just-created Event would stay invisible until staleTime expired.
  useEffect(() => {
    queryClient.setQueryData(eventsQueryKey, initialData);
  }, [queryClient, initialData]);

  const { openSemester, eventTypes, events: allEvents } = data;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-8">
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
                        ` (₱${event.wholeDayPenalty} full absence)`}
                    </TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <EventActions event={event} eventTypes={eventTypes} />
                      <Button asChild variant="secondary" size="icon-sm">
                        <Link href={`/events/${event.id}/attendance`} aria-label="Attendance">
                          <CalendarCheck />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card id="new-event">
        <CardHeader>
          <CardTitle>Create Event</CardTitle>
        </CardHeader>
        <CardContent>
          {openSemester ? (
            <form id="create-event-form" action={createEvent} className="flex max-w-sm flex-col gap-4">
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
                <Select name="type" required defaultValue={eventTypes[0]}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
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
              <ConfirmSubmitButton
                formId="create-event-form"
                title="Create this Event?"
                description="Officers can scan Attendance and record Payments against it right away."
                confirmLabel="Create Event"
                triggerLabel="Create Event"
                triggerVariant="default"
                triggerSize="default"
              />
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

// Edit and delete both live under this one row menu, each its own dialog
// (ADR 0007 — no ownership check, so every Officer sees both on every row).
// Errors (Semester-closure rejections, "Event not found") render inline and
// keep the dialog open rather than bouncing the Officer to a fresh page.
function EventActions({
  event,
  eventTypes,
}: {
  event: EventRow;
  eventTypes: EventsSnapshot["eventTypes"];
}) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // The edit form's Save doesn't mutate directly (#222) — it captures the
  // typed values and opens a second confirmation on top naming the change,
  // leaving the edit dialog open underneath so Cancel returns to the form
  // with nothing lost.
  const [pendingUpdate, setPendingUpdate] = useState<FormData | null>(null);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: eventsQueryKey });
  }

  function summarizeEventChanges(formData: FormData): string {
    const changes: string[] = [];
    const name = formData.get("name");
    if (typeof name === "string" && name !== event.name) changes.push(`Name → ${name}`);
    const date = formData.get("date");
    if (typeof date === "string" && date !== event.date) changes.push(`Date → ${date}`);
    const type = formData.get("type");
    if (typeof type === "string" && type !== event.type) {
      changes.push(`Type → ${type === "whole_day" ? "Whole-day" : "Half-day"}`);
    }
    const penalty = formData.get("halfDayPenaltyAmount");
    if (typeof penalty === "string" && penalty !== String(event.halfDayPenaltyAmount)) {
      changes.push(`Half-day penalty → ₱${penalty}`);
    }
    return changes.length > 0 ? `Updates: ${changes.join(", ")}.` : "No changes to apply.";
  }

  return (
    <>
      <AlertDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          setError(null);
        }}
      >
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label="Edit">
            <Pencil />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit {event.name}</AlertDialogTitle>
          </AlertDialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              setPendingUpdate(new FormData(e.currentTarget));
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`name-${event.id}`}>Name</Label>
              <Input id={`name-${event.id}`} name="name" defaultValue={event.name} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`date-${event.id}`}>Date</Label>
              <Input
                id={`date-${event.id}`}
                name="date"
                type="date"
                defaultValue={event.date}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`type-${event.id}`}>Type</Label>
              <Select name="type" defaultValue={event.type} required>
                <SelectTrigger id={`type-${event.id}`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "whole_day" ? "Whole-day" : "Half-day"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`penalty-${event.id}`}>Half-day absence penalty (₱)</Label>
              <Input
                id={`penalty-${event.id}`}
                name="halfDayPenaltyAmount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={event.halfDayPenaltyAmount}
                required
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
              <Button type="submit" disabled={pending}>
                Save
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingUpdate !== null}
        onOpenChange={(open) => {
          if (!open) setPendingUpdate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save changes to {event.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingUpdate && summarizeEventChanges(pendingUpdate)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button
              disabled={pending}
              onClick={() => {
                const formData = pendingUpdate;
                if (!formData) return;
                startTransition(async () => {
                  const result = await updateEvent(event.id, formData);
                  if (result.error) {
                    setError(result.error);
                    return;
                  }
                  setPendingUpdate(null);
                  setEditOpen(false);
                  await refresh();
                });
              }}
            >
              {pending ? "Saving…" : "Confirm"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          setError(null);
        }}
      >
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="icon-sm" aria-label="Delete">
            <Trash2 />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {event.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the Event outright. There&apos;s no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteEvent(event.id);
                  if (result.error) {
                    setError(result.error);
                    return;
                  }
                  setDeleteOpen(false);
                  await refresh();
                })
              }
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
