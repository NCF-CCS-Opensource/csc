import { randomUUID } from "node:crypto";
import { events, semesters, students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

// requireOfficerOrGovernor resolves the actor from Clerk's auth() plus the
// students table (see lib/auth.ts) — mocked here so the test drives who's
// "logged in" without a real Clerk session. revalidatePath needs a request
// scope Next.js doesn't provide under vitest, so it's stubbed out too.
const authMock = vi.hoisted(() => vi.fn());
vi.mock("@clerk/nextjs/server", () => ({ auth: authMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { db } from "@/lib/db";
import { deleteEvent, updateEvent } from "./actions";

// Shares a database with lib/architecture.integration.test.ts (see
// packages/db/scripts/test-integration.sh) — clears the tables both files
// touch so a stray open Semester from the other file can't collide with
// the "one open Semester" constraint here.
beforeEach(async () => {
  await db.delete(events);
  await db.delete(semesters);
  await db.delete(students);
});

async function seedOfficer(suffix: string) {
  const [officer] = await db
    .insert(students)
    .values({
      authUserId: `user_${suffix}`,
      email: `${suffix}@gbox.ncf.edu.ph`,
      name: `Officer ${suffix}`,
      program: "Computer Science",
      studentId: suffix,
      role: "officer",
    })
    .returning();
  return officer;
}

function eventFormData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("Events server actions", () => {
  it("lets a different Officer edit and delete another Officer's Event, and surfaces Semester-closure rejections (ADR 0007)", async () => {
    // No creator Officer to seed — ADR 0007 deliberately dropped the creator
    // column, so this Event starts out unowned by any Officer.
    const editor = await seedOfficer(`editor-${randomUUID().slice(0, 8)}`);

    const [semester] = await db
      .insert(semesters)
      .values({ startDate: "2026-06-01", endDate: "2026-10-31" })
      .returning();
    const [created] = await db
      .insert(events)
      .values({
        name: "Foundation Day",
        date: "2026-07-15",
        type: "half_day",
        halfDayPenaltyAmount: "50.00",
        semesterId: semester.id,
      })
      .returning();

    // A different Officer than the one who created the Event edits it — no
    // ownership check anywhere in the path (ADR 0007).
    authMock.mockResolvedValue({ userId: editor.authUserId });
    const edited = await updateEvent(
      created.id,
      eventFormData({
        name: "CCS Foundation Day",
        date: "2026-07-15",
        type: "half_day",
        halfDayPenaltyAmount: "50.00",
      }),
    );
    expect(edited).toEqual({ error: null });
    expect(
      await db.query.events.findFirst({ where: eq(events.id, created.id) }),
    ).toMatchObject({ name: "CCS Foundation Day" });

    // Semester-closure validation still applies to edits made through the
    // server action — the rejection surfaces as a message, not a throw.
    await db
      .update(semesters)
      .set({ closedAt: new Date() })
      .where(eq(semesters.id, semester.id));
    const rejected = await updateEvent(
      created.id,
      eventFormData({
        name: "Renamed",
        date: "2026-07-15",
        type: "half_day",
        halfDayPenaltyAmount: "50.00",
      }),
    );
    expect(rejected).toEqual({ error: "Closed Semester Events cannot be changed" });

    // Delete, still as the non-creator Officer, once the Semester reopens.
    await db
      .update(semesters)
      .set({ closedAt: null })
      .where(eq(semesters.id, semester.id));
    const deleted = await deleteEvent(created.id);
    expect(deleted).toEqual({ error: null });
    expect(
      await db.query.events.findFirst({ where: eq(events.id, created.id) }),
    ).toBeUndefined();
  });
});
