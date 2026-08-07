import {
  attendanceSessions,
  events,
  payments,
  penalties,
  scans,
  semesters,
  students,
} from "@attendance/db";
import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import {
  createEvent,
  deleteEvent,
  EventLifecycleError,
  updateEvent,
} from "./events";
import {
  createSemester,
  SemesterLifecycleError,
  updateSemesterDates,
} from "./semesters";
import {
  correctAttendance,
  recordPayments,
  syncPenaltyForSession,
} from "./penalties";
import {
  applyScanDecision,
  identifyScanStudent,
  ScanApprovalError,
} from "./scan-approval";

const governor = { role: "governor" as const };
const officer = { role: "officer" as const };

async function seedScanFixture() {
  await db.insert(semesters).values({
    startDate: "2026-06-01",
    endDate: "2026-10-31",
  });
  const event = await createEvent(officer, {
    name: "Foundation Day",
    date: "2026-07-15",
    type: "half_day",
    halfDayPenaltyAmount: "50.00",
  });
  const [student, actor] = await db
    .insert(students)
    .values([
      {
        email: "student@example.com",
        authUserId: "user_student",
        name: "Grace Hopper",
        program: "Computer Science",
        studentId: "24-001",
      },
      {
        email: "officer@example.com",
        authUserId: "user_officer",
        name: "Ada Lovelace",
        program: "Computer Science",
        studentId: "24-002",
        role: "officer",
      },
    ])
    .returning();
  return { actor, event, student };
}

beforeEach(async () => {
  await db.delete(payments);
  await db.delete(penalties);
  await db.delete(scans);
  await db.delete(attendanceSessions);
  await db.delete(events);
  await db.delete(semesters);
  await db.delete(students);
});

describe("Semester lifecycle", () => {
  it("reports the one-open-Semester constraint to the Governor", async () => {
    await createSemester(governor, {
      startDate: "2026-01-01",
      endDate: "2026-05-31",
    });

    await expect(
      createSemester(governor, {
        startDate: "2026-06-01",
        endDate: "2026-10-31",
      }),
    ).rejects.toEqual(
      new SemesterLifecycleError(
        "Close the current Semester before opening a new one",
      ),
    );
  });

  it("keeps every existing Event inside an edited date range", async () => {
    const [semester] = await db
      .insert(semesters)
      .values({ startDate: "2026-06-01", endDate: "2026-10-31" })
      .returning();
    await db.insert(events).values({
      name: "Foundation Day",
      semesterId: semester.id,
      date: "2026-07-15",
      type: "half_day",
      halfDayPenaltyAmount: "50.00",
    });

    await expect(
      updateSemesterDates(governor, semester.id, {
        startDate: "2026-08-01",
        endDate: "2026-10-31",
      }),
    ).rejects.toEqual(
      new SemesterLifecycleError(
        "Semester dates must include every existing Event",
      ),
    );

    await updateSemesterDates(governor, semester.id, {
      startDate: "2026-05-01",
      endDate: "2026-11-30",
    });
    expect(
      await db.query.semesters.findFirst({
        where: eq(semesters.id, semester.id),
      }),
    ).toMatchObject({
      startDate: "2026-05-01",
      endDate: "2026-11-30",
    });
  });
});

describe("Event lifecycle", () => {
  it("creates a validated Event in the open Semester", async () => {
    const [semester] = await db
      .insert(semesters)
      .values({ startDate: "2026-06-01", endDate: "2026-10-31" })
      .returning();

    const created = await createEvent(officer, {
      name: "Foundation Day",
      date: "2026-07-15",
      venue: "ST Quad",
      type: "half_day",
      halfDayPenaltyAmount: "50.00",
    });

    expect(created).toMatchObject({
      name: "Foundation Day",
      semesterId: semester.id,
      date: "2026-07-15",
      venue: "ST Quad",
      type: "half_day",
      halfDayPenaltyAmount: "50.00",
    });
  });

  it("reports the same missing-Semester error through the command", async () => {
    await expect(
      createEvent(officer, {
        name: "Foundation Day",
        date: "2026-07-15",
        type: "half_day",
        halfDayPenaltyAmount: "50.00",
      }),
    ).rejects.toEqual(
      new EventLifecycleError(
        "No open Semester — ask the Governor to open one",
      ),
    );
  });

  it("updates every Event field before attendance begins", async () => {
    await db.insert(semesters).values({
      startDate: "2026-06-01",
      endDate: "2026-10-31",
    });
    const created = await createEvent(officer, {
      name: "Foundation Day",
      date: "2026-07-15",
      type: "half_day",
      halfDayPenaltyAmount: "50.00",
    });

    const updated = await updateEvent(officer, created.id, {
      name: "CCS Foundation Day",
      date: "2026-07-16",
      venue: "ST Quad",
      type: "whole_day",
      halfDayPenaltyAmount: "75.00",
    });

    expect(updated).toMatchObject({
      name: "CCS Foundation Day",
      date: "2026-07-16",
      venue: "ST Quad",
      type: "whole_day",
      halfDayPenaltyAmount: "75.00",
    });
  });

  it("allows only name and venue changes after attendance begins", async () => {
    await db.insert(semesters).values({
      startDate: "2026-06-01",
      endDate: "2026-10-31",
    });
    const created = await createEvent(officer, {
      name: "Foundation Day",
      date: "2026-07-15",
      type: "half_day",
      halfDayPenaltyAmount: "50.00",
    });
    const [actor] = await db
      .insert(students)
      .values({
        email: "officer@example.com",
        authUserId: "user_officer",
        name: "Ada Lovelace",
        program: "Computer Science",
        studentId: "24-001",
        role: "officer",
      })
      .returning();
    await db.insert(scans).values({
      id: randomUUID(),
      eventId: created.id,
      studentId: actor.id,
      qrPayload: "{}",
      result: "rejected",
      officerId: actor.id,
      scannedAt: new Date("2026-07-15T08:00:00Z"),
    });

    await updateEvent(officer, created.id, {
      ...created,
      name: "CCS Foundation Day",
      venue: "ST Quad",
    });
    await expect(
      updateEvent(officer, created.id, {
        ...created,
        name: "CCS Foundation Day",
        venue: "ST Quad",
        date: "2026-07-16",
      }),
    ).rejects.toEqual(
      new EventLifecycleError(
        "Only name and venue may change after attendance begins",
      ),
    );
  });

  it("freezes Event definition after Semester closure", async () => {
    const [semester] = await db
      .insert(semesters)
      .values({ startDate: "2026-06-01", endDate: "2026-10-31" })
      .returning();
    const created = await createEvent(officer, {
      name: "Foundation Day",
      date: "2026-07-15",
      type: "half_day",
      halfDayPenaltyAmount: "50.00",
    });
    await db
      .update(semesters)
      .set({ closedAt: new Date() })
      .where(eq(semesters.id, semester.id));

    await expect(
      updateEvent(officer, created.id, {
        ...created,
        name: "Renamed Foundation Day",
        venue: created.venue ?? undefined,
      }),
    ).rejects.toEqual(
      new EventLifecycleError("Closed Semester Events cannot be changed"),
    );
  });

  it("deletes a setup Event before attendance begins", async () => {
    await db.insert(semesters).values({
      startDate: "2026-06-01",
      endDate: "2026-10-31",
    });
    const created = await createEvent(officer, {
      name: "Setup mistake",
      date: "2026-07-15",
      type: "half_day",
      halfDayPenaltyAmount: "50.00",
    });

    await deleteEvent(officer, created.id);

    expect(
      await db.query.events.findFirst({ where: eq(events.id, created.id) }),
    ).toBeUndefined();
  });

  it("keeps an Event with a rejected Scan", async () => {
    await db.insert(semesters).values({
      startDate: "2026-06-01",
      endDate: "2026-10-31",
    });
    const created = await createEvent(officer, {
      name: "Foundation Day",
      date: "2026-07-15",
      type: "half_day",
      halfDayPenaltyAmount: "50.00",
    });
    const [actor] = await db
      .insert(students)
      .values({
        email: "officer@example.com",
        authUserId: "user_officer",
        name: "Ada Lovelace",
        program: "Computer Science",
        studentId: "24-001",
        role: "officer",
      })
      .returning();
    await db.insert(scans).values({
      id: randomUUID(),
      eventId: created.id,
      studentId: actor.id,
      qrPayload: "{}",
      result: "rejected",
      officerId: actor.id,
      scannedAt: new Date("2026-07-15T08:00:00Z"),
    });

    await expect(deleteEvent(officer, created.id)).rejects.toEqual(
      new EventLifecycleError(
        "Events with attendance history cannot be deleted",
      ),
    );
    expect(
      await db.query.events.findFirst({ where: eq(events.id, created.id) }),
    ).toBeDefined();
    expect(
      await db.query.scans.findFirst({ where: eq(scans.eventId, created.id) }),
    ).toBeDefined();
  });

  it("keeps Attendance Sessions, Penalties, and Payments when deletion is rejected", async () => {
    await db.insert(semesters).values({
      startDate: "2026-06-01",
      endDate: "2026-10-31",
    });
    const created = await createEvent(officer, {
      name: "Foundation Day",
      date: "2026-07-15",
      type: "half_day",
      halfDayPenaltyAmount: "50.00",
    });
    const [student, actor] = await db
      .insert(students)
      .values([
        {
          email: "student@example.com",
          authUserId: "user_student",
          name: "Grace Hopper",
          program: "Computer Science",
          studentId: "24-001",
        },
        {
          email: "officer@example.com",
          authUserId: "user_officer",
          name: "Ada Lovelace",
          program: "Computer Science",
          studentId: "24-002",
          role: "officer",
        },
      ])
      .returning();
    const [session] = await db
      .insert(attendanceSessions)
      .values({
        eventId: created.id,
        studentId: student.id,
        half: "am",
      })
      .returning();
    const [penalty] = await db
      .insert(penalties)
      .values({
        attendanceSessionId: session.id,
        studentId: student.id,
        amount: "50.00",
      })
      .returning();
    await db.insert(payments).values({
      penaltyId: penalty.id,
      amount: "50.00",
      officerId: actor.id,
    });

    await expect(deleteEvent(officer, created.id)).rejects.toEqual(
      new EventLifecycleError(
        "Events with attendance history cannot be deleted",
      ),
    );
    expect(await db.query.attendanceSessions.findFirst()).toBeDefined();
    expect(await db.query.penalties.findFirst()).toBeDefined();
    expect(await db.query.payments.findFirst()).toBeDefined();
  });

  it("keeps Events in a closed Semester", async () => {
    const [semester] = await db
      .insert(semesters)
      .values({ startDate: "2026-06-01", endDate: "2026-10-31" })
      .returning();
    const created = await createEvent(officer, {
      name: "Foundation Day",
      date: "2026-07-15",
      type: "half_day",
      halfDayPenaltyAmount: "50.00",
    });
    await db
      .update(semesters)
      .set({ closedAt: new Date() })
      .where(eq(semesters.id, semester.id));

    await expect(deleteEvent(officer, created.id)).rejects.toEqual(
      new EventLifecycleError(
        "Closed Semester Events cannot be deleted",
      ),
    );
  });

  it("allows Attendance correction and Payment recording after closure", async () => {
    const { actor, event, student } = await seedScanFixture();
    await db.update(semesters).set({ closedAt: new Date() });
    const [session] = await db
      .insert(attendanceSessions)
      .values({
        eventId: event.id,
        studentId: student.id,
        half: "am",
        timeIn: new Date("2026-07-15T08:00:00Z"),
      })
      .returning();
    await syncPenaltyForSession(session.id);
    const penalty = await db.query.penalties.findFirst();
    await recordPayments([penalty!.id], actor.id);
    await correctAttendance(session.id, "timeOut", true);

    expect(await db.query.attendanceSessions.findFirst()).toMatchObject({
      timeOut: expect.any(Date),
    });
    expect(await db.query.penalties.findFirst()).toBeDefined();
    expect(await db.query.payments.findFirst()).toBeDefined();
  });
});

describe("Scan Approval", () => {
  it("reveals Student details only for a canonical QR payload", async () => {
    const { actor, student } = await seedScanFixture();

    await expect(
      identifyScanStudent(
        actor,
        JSON.stringify({
          name: student.name,
          studentId: student.studentId,
          program: student.program,
        }),
      ),
    ).resolves.toEqual({
      student: {
        name: student.name,
        studentId: student.studentId,
        program: student.program,
      },
    });
    await expect(
      identifyScanStudent(
        actor,
        JSON.stringify({
          name: "Wrong Name",
          studentId: student.studentId,
          program: student.program,
        }),
      ),
    ).resolves.toEqual({
      error: "QR does not match current Student record",
    });
    await expect(
      identifyScanStudent(actor, "not-json"),
    ).resolves.toEqual({ error: "Unreadable QR" });
  });

  it("commits an approved Scan, Attendance Session, and Penalty together", async () => {
    const { actor, event, student } = await seedScanFixture();
    const scanId = randomUUID();

    await applyScanDecision(actor, {
      scanId,
      type: "approve",
      eventId: event.id,
      mode: "time_in_am",
      qrPayload: JSON.stringify({
        name: student.name,
        studentId: student.studentId,
        program: student.program,
      }),
      scannedAt: "2026-07-15T08:00:00.000Z",
    });

    expect(
      await db.query.scans.findFirst({ where: eq(scans.id, scanId) }),
    ).toMatchObject({ result: "approved", studentId: student.id });
    expect(await db.query.attendanceSessions.findFirst()).toMatchObject({
      eventId: event.id,
      studentId: student.id,
      half: "am",
      timeIn: new Date("2026-07-15T08:00:00.000Z"),
      timeOut: null,
    });
    expect(await db.query.penalties.findFirst()).toMatchObject({
      studentId: student.id,
      amount: "50.00",
    });
  });

  it("retains a rejected decision without changing attendance", async () => {
    const { actor, event, student } = await seedScanFixture();
    const scanId = randomUUID();

    await applyScanDecision(actor, {
      scanId,
      type: "reject",
      eventId: event.id,
      qrPayload: JSON.stringify({
        name: student.name,
        studentId: student.studentId,
        program: student.program,
      }),
      scannedAt: "2026-07-15T08:00:00.000Z",
    });

    expect(
      await db.query.scans.findFirst({ where: eq(scans.id, scanId) }),
    ).toMatchObject({ result: "rejected", studentId: student.id, mode: null });
    expect(await db.query.attendanceSessions.findFirst()).toBeUndefined();
    expect(await db.query.penalties.findFirst()).toBeUndefined();
  });

  it("retains unreadable and non-canonical approval attempts as rejections", async () => {
    const { actor, event, student } = await seedScanFixture();

    await expect(
      applyScanDecision(actor, {
        scanId: randomUUID(),
        type: "approve",
        eventId: event.id,
        mode: "time_in_am",
        qrPayload: "not-json",
        scannedAt: "2026-07-15T08:00:00.000Z",
      }),
    ).rejects.toEqual(new ScanApprovalError("Unreadable QR"));
    await expect(
      applyScanDecision(actor, {
        scanId: randomUUID(),
        type: "approve",
        eventId: event.id,
        mode: "time_in_am",
        qrPayload: JSON.stringify({
          name: "Wrong Name",
          studentId: student.studentId,
          program: student.program,
        }),
        scannedAt: "2026-07-15T08:01:00.000Z",
      }),
    ).rejects.toEqual(
      new ScanApprovalError("QR does not match current Student record"),
    );

    expect(await db.query.scans.findMany()).toEqual([
      expect.objectContaining({ result: "rejected", mode: "time_in_am" }),
      expect.objectContaining({
        result: "rejected",
        mode: "time_in_am",
        studentId: student.id,
      }),
    ]);
    expect(await db.query.attendanceSessions.findFirst()).toBeUndefined();
  });

  it("returns an identical Scan UUID replay without changing attendance again", async () => {
    const { actor, event, student } = await seedScanFixture();
    const decision = {
      scanId: randomUUID(),
      type: "approve" as const,
      eventId: event.id,
      mode: "time_in_am",
      qrPayload: JSON.stringify({
        name: student.name,
        studentId: student.studentId,
        program: student.program,
      }),
      scannedAt: "2026-07-15T08:00:00.000Z",
    };

    const first = await applyScanDecision(actor, decision);
    const replay = await applyScanDecision(actor, decision);

    expect(replay).toEqual(first);
    expect(await db.query.scans.findMany()).toHaveLength(1);
    expect(await db.query.attendanceSessions.findMany()).toHaveLength(1);
    expect(await db.query.penalties.findMany()).toHaveLength(1);
  });

  it("rejects a conflicting reuse of a Scan UUID without changing attendance", async () => {
    const { actor, event, student } = await seedScanFixture();
    const decision = {
      scanId: randomUUID(),
      type: "approve" as const,
      eventId: event.id,
      mode: "time_in_am",
      qrPayload: JSON.stringify({
        name: student.name,
        studentId: student.studentId,
        program: student.program,
      }),
      scannedAt: "2026-07-15T08:00:00.000Z",
    };
    await applyScanDecision(actor, decision);

    await expect(
      applyScanDecision(actor, {
        ...decision,
        scannedAt: "2026-07-15T09:00:00.000Z",
      }),
    ).rejects.toEqual(
      new ScanApprovalError(
        "Scan UUID conflicts with a different decision",
        409,
      ),
    );
    expect(await db.query.scans.findMany()).toHaveLength(1);
    expect(await db.query.attendanceSessions.findFirst()).toMatchObject({
      timeIn: new Date("2026-07-15T08:00:00.000Z"),
    });
  });

  it("keeps earliest Time-in and latest Time-out from out-of-order decisions", async () => {
    const { actor, event, student } = await seedScanFixture();
    const qrPayload = JSON.stringify({
      name: student.name,
      studentId: student.studentId,
      program: student.program,
    });
    for (const [mode, scannedAt] of [
      ["time_in_am", "2026-07-15T09:00:00.000Z"],
      ["time_in_am", "2026-07-15T08:00:00.000Z"],
      ["time_out_am", "2026-07-15T16:00:00.000Z"],
      ["time_out_am", "2026-07-15T17:00:00.000Z"],
    ] as const) {
      await applyScanDecision(actor, {
        scanId: randomUUID(),
        type: "approve",
        eventId: event.id,
        mode,
        qrPayload,
        scannedAt,
      });
    }

    expect(await db.query.attendanceSessions.findFirst()).toMatchObject({
      timeIn: new Date("2026-07-15T08:00:00.000Z"),
      timeOut: new Date("2026-07-15T17:00:00.000Z"),
    });
    expect(await db.query.scans.findMany()).toHaveLength(4);
    expect(await db.query.penalties.findFirst()).toBeUndefined();
  });

  it("rolls back the complete approval when Penalty persistence fails", async () => {
    const { actor, event, student } = await seedScanFixture();
    const scanId = randomUUID();
    await db.execute(sql`
      create function fail_penalty_insert() returns trigger language plpgsql as $$
      begin
        raise exception 'forced penalty failure';
      end;
      $$
    `);
    await db.execute(sql`
      create trigger fail_penalty before insert on penalties
      for each row execute function fail_penalty_insert()
    `);

    try {
      await expect(
        applyScanDecision(actor, {
          scanId,
          type: "approve",
          eventId: event.id,
          mode: "time_in_am",
          qrPayload: JSON.stringify({
            name: student.name,
            studentId: student.studentId,
            program: student.program,
          }),
          scannedAt: "2026-07-15T08:00:00.000Z",
        }),
      ).rejects.toThrow("forced penalty failure");
    } finally {
      await db.execute(sql`drop trigger fail_penalty on penalties`);
      await db.execute(sql`drop function fail_penalty_insert()`);
    }

    expect(await db.query.scans.findFirst()).toBeUndefined();
    expect(await db.query.attendanceSessions.findFirst()).toBeUndefined();
    expect(await db.query.penalties.findFirst()).toBeUndefined();
  });
});
import { randomUUID } from "node:crypto";
