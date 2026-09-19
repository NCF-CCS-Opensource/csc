import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Test } from "@nestjs/testing";
import { Reflector } from "@nestjs/core";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { eq } from "drizzle-orm";
import {
  attendanceSessions,
  createDb,
  events,
  scans,
  semesters,
  students,
} from "@attendance/db";

import { TOKEN_VERIFIER } from "../src/shared/domain/token-verifier";
import { DB } from "../src/shared/infrastructure/db.module";
import { STUDENT_REPOSITORY } from "../src/modules/student/domain/student-repository";
import { DrizzleStudentRepository } from "../src/modules/student/infrastructure/drizzle-student.repository";
import { SEMESTER_REPOSITORY } from "../src/modules/semester/domain/semester-repository";
import { DrizzleSemesterRepository } from "../src/modules/semester/infrastructure/drizzle-semester.repository";
import { CreateSemesterUseCase } from "../src/modules/semester/application/create-semester.use-case";
import { UpdateSemesterDatesUseCase } from "../src/modules/semester/application/update-semester-dates.use-case";
import { CloseSemesterUseCase } from "../src/modules/semester/application/close-semester.use-case";
import { GetOpenSemesterUseCase } from "../src/modules/semester/application/get-open-semester.use-case";
import { SemesterController } from "../src/modules/semester/presentation/semester.controller";
import { EVENT_REPOSITORY } from "../src/modules/event/domain/event-repository";
import { DrizzleEventRepository } from "../src/modules/event/infrastructure/drizzle-event.repository";
import { ListEventsUseCase } from "../src/modules/event/application/list-events.use-case";
import { CreateEventUseCase } from "../src/modules/event/application/create-event.use-case";
import { UpdateEventUseCase } from "../src/modules/event/application/update-event.use-case";
import { DeleteEventUseCase } from "../src/modules/event/application/delete-event.use-case";
import { EventController } from "../src/modules/event/presentation/event.controller";
import { AuthGuard } from "../src/shared/presentation/auth.guard";
import { CapabilityGuard } from "../src/shared/presentation/capability.guard";

// Ported from apps/web/lib/architecture.integration.test.ts's "Semester
// lifecycle" and "Event lifecycle" describe blocks (the ~38-test acceptance
// gate, ADR-0017). Runs through the real NestJS controllers against a
// disposable Postgres (packages/db/scripts/test-integration.sh), so it proves
// both the lifecycle rules AND the authorization wiring together — unlike
// authorization.e2e.test.ts, which mocks the repositories.
//
// Not ported: "allows Attendance correction and Payment recording after
// closure" — that exercises the Attendance/Penalty/Payment modules, which are
// a later slice (docs/rewrite-plan.md) and don't exist in apps/api yet.

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL is required");

const host = new URL(connectionString).hostname;
if (!["127.0.0.1", "localhost", "[::1]"].includes(host)) {
  throw new Error("Integration tests only run against disposable local Postgres");
}

const db = createDb(connectionString);

describe("Semester and Event lifecycle (e2e)", () => {
  let app: INestApplication;
  const verify = vi.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SemesterController, EventController],
      providers: [
        { provide: DB, useValue: db },
        { provide: TOKEN_VERIFIER, useValue: { verify } },
        { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
        { provide: SEMESTER_REPOSITORY, useClass: DrizzleSemesterRepository },
        { provide: EVENT_REPOSITORY, useClass: DrizzleEventRepository },
        CreateSemesterUseCase,
        UpdateSemesterDatesUseCase,
        CloseSemesterUseCase,
        GetOpenSemesterUseCase,
        ListEventsUseCase,
        CreateEventUseCase,
        UpdateEventUseCase,
        DeleteEventUseCase,
        AuthGuard,
        CapabilityGuard,
        Reflector,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    verify.mockReset();
    await db.delete(scans);
    await db.delete(attendanceSessions);
    await db.delete(events);
    await db.delete(semesters);
    await db.delete(students);
  });

  async function seedActor(role: "officer" | "governor") {
    const suffix = randomUUID().slice(0, 8);
    const [actor] = await db
      .insert(students)
      .values({
        authUserId: `user_${role}_${suffix}`,
        email: `${role}-${suffix}@example.com`,
        name: role === "governor" ? "Gigi Governor" : "Ollie Officer",
        program: "Computer Science",
        studentId: `S-${suffix}`,
        role,
      })
      .returning();
    return actor;
  }

  function authAs(actor: { authUserId: string }) {
    verify.mockResolvedValue({ authUserId: actor.authUserId });
  }

  const server = () => app.getHttpServer();
  const bearer = "Bearer token";

  describe("Semester lifecycle", () => {
    it("reports the one-open-Semester constraint to the Governor", async () => {
      const governor = await seedActor("governor");
      authAs(governor);

      await request(server())
        .post("/semester/create")
        .set("Authorization", bearer)
        .send({ startDate: "2026-01-01", endDate: "2026-05-31" })
        .expect(201);

      const response = await request(server())
        .post("/semester/create")
        .set("Authorization", bearer)
        .send({ startDate: "2026-06-01", endDate: "2026-10-31" });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "Close the current Semester before opening a new one",
      );
    });

    it("keeps every existing Event inside an edited date range", async () => {
      const governor = await seedActor("governor");
      authAs(governor);
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

      const rejected = await request(server())
        .post("/semester/update")
        .set("Authorization", bearer)
        .send({ id: semester.id, startDate: "2026-08-01", endDate: "2026-10-31" });
      expect(rejected.status).toBe(409);
      expect(rejected.body.message).toBe(
        "Semester dates must include every existing Event",
      );

      const accepted = await request(server())
        .post("/semester/update")
        .set("Authorization", bearer)
        .send({ id: semester.id, startDate: "2026-05-01", endDate: "2026-11-30" });
      expect(accepted.status).toBe(201);
      expect(accepted.body).toMatchObject({
        startDate: "2026-05-01",
        endDate: "2026-11-30",
      });
    });
  });

  describe("Event lifecycle", () => {
    async function openSemester() {
      const [semester] = await db
        .insert(semesters)
        .values({ startDate: "2026-06-01", endDate: "2026-10-31" })
        .returning();
      return semester;
    }

    it("creates a validated Event in the open Semester", async () => {
      const officer = await seedActor("officer");
      authAs(officer);
      const semester = await openSemester();

      const response = await request(server())
        .post("/event/create")
        .set("Authorization", bearer)
        .send({
          name: "Foundation Day",
          date: "2026-07-15",
          venue: "ST Quad",
          type: "half_day",
          halfDayPenaltyAmount: "50.00",
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: "Foundation Day",
        semesterId: semester.id,
        date: "2026-07-15",
        venue: "ST Quad",
        type: "half_day",
        halfDayPenaltyAmount: "50.00",
      });
    });

    it("reports the same missing-Semester error through the command", async () => {
      const officer = await seedActor("officer");
      authAs(officer);

      const response = await request(server())
        .post("/event/create")
        .set("Authorization", bearer)
        .send({
          name: "Foundation Day",
          date: "2026-07-15",
          type: "half_day",
          halfDayPenaltyAmount: "50.00",
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "No open Semester — ask the Governor to open one",
      );
    });

    it("updates every Event field before attendance begins", async () => {
      const officer = await seedActor("officer");
      authAs(officer);
      await openSemester();
      const created = await request(server())
        .post("/event/create")
        .set("Authorization", bearer)
        .send({
          name: "Foundation Day",
          date: "2026-07-15",
          type: "half_day",
          halfDayPenaltyAmount: "50.00",
        });

      const updated = await request(server())
        .post("/event/update")
        .set("Authorization", bearer)
        .send({
          id: created.body.id,
          name: "CCS Foundation Day",
          date: "2026-07-16",
          venue: "ST Quad",
          type: "whole_day",
          halfDayPenaltyAmount: "75.00",
        });

      expect(updated.status).toBe(201);
      expect(updated.body).toMatchObject({
        name: "CCS Foundation Day",
        date: "2026-07-16",
        venue: "ST Quad",
        type: "whole_day",
        halfDayPenaltyAmount: "75.00",
      });
    });

    it("allows only name and venue changes after attendance begins, and rejects a different Officer's edit only on the mutability rule (ADR-0007)", async () => {
      const creator = await seedActor("officer");
      const editor = await seedActor("officer");
      authAs(creator);
      await openSemester();
      const created = await request(server())
        .post("/event/create")
        .set("Authorization", bearer)
        .send({
          name: "Foundation Day",
          date: "2026-07-15",
          type: "half_day",
          halfDayPenaltyAmount: "50.00",
        });

      await db.insert(scans).values({
        id: randomUUID(),
        eventId: created.body.id,
        studentId: creator.id,
        qrPayload: "{}",
        result: "rejected",
        officerId: creator.id,
        scannedAt: new Date("2026-07-15T08:00:00Z"),
      });

      // A different Officer than the creator edits it — no ownership check
      // anywhere in the path (ADR-0007) — and only name/venue may change.
      authAs(editor);
      const allowed = await request(server())
        .post("/event/update")
        .set("Authorization", bearer)
        .send({
          id: created.body.id,
          name: "CCS Foundation Day",
          venue: "ST Quad",
          date: "2026-07-15",
          type: "half_day",
          halfDayPenaltyAmount: "50.00",
        });
      expect(allowed.status).toBe(201);

      const rejected = await request(server())
        .post("/event/update")
        .set("Authorization", bearer)
        .send({
          id: created.body.id,
          name: "CCS Foundation Day",
          venue: "ST Quad",
          date: "2026-07-16",
          type: "half_day",
          halfDayPenaltyAmount: "50.00",
        });
      expect(rejected.status).toBe(409);
      expect(rejected.body.message).toBe(
        "Only name and venue may change after attendance begins",
      );
    });

    it("freezes Event definition after Semester closure", async () => {
      const governor = await seedActor("governor");
      authAs(governor);
      const semester = await openSemester();
      const created = await request(server())
        .post("/event/create")
        .set("Authorization", bearer)
        .send({
          name: "Foundation Day",
          date: "2026-07-15",
          type: "half_day",
          halfDayPenaltyAmount: "50.00",
        });
      await request(server())
        .post("/semester/close")
        .set("Authorization", bearer)
        .send({ id: semester.id });

      const response = await request(server())
        .post("/event/update")
        .set("Authorization", bearer)
        .send({
          id: created.body.id,
          name: "Renamed Foundation Day",
          date: "2026-07-15",
          type: "half_day",
          halfDayPenaltyAmount: "50.00",
        });
      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Closed Semester Events cannot be changed");
    });

    it("deletes a setup Event before attendance begins", async () => {
      const officer = await seedActor("officer");
      authAs(officer);
      await openSemester();
      const created = await request(server())
        .post("/event/create")
        .set("Authorization", bearer)
        .send({
          name: "Setup mistake",
          date: "2026-07-15",
          type: "half_day",
          halfDayPenaltyAmount: "50.00",
        });

      const response = await request(server())
        .post("/event/delete")
        .set("Authorization", bearer)
        .send({ id: created.body.id });
      expect(response.status).toBe(201);
      expect(
        await db.query.events.findFirst({ where: eq(events.id, created.body.id) }),
      ).toBeUndefined();
    });

    it("keeps an Event with a rejected Scan — not deletable", async () => {
      const officer = await seedActor("officer");
      authAs(officer);
      await openSemester();
      const created = await request(server())
        .post("/event/create")
        .set("Authorization", bearer)
        .send({
          name: "Foundation Day",
          date: "2026-07-15",
          type: "half_day",
          halfDayPenaltyAmount: "50.00",
        });
      await db.insert(scans).values({
        id: randomUUID(),
        eventId: created.body.id,
        studentId: officer.id,
        qrPayload: "{}",
        result: "rejected",
        officerId: officer.id,
        scannedAt: new Date("2026-07-15T08:00:00Z"),
      });

      const response = await request(server())
        .post("/event/delete")
        .set("Authorization", bearer)
        .send({ id: created.body.id });
      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "Events with attendance history cannot be deleted",
      );
      expect(
        await db.query.events.findFirst({ where: eq(events.id, created.body.id) }),
      ).toBeDefined();
      expect(
        await db.query.scans.findFirst({ where: eq(scans.eventId, created.body.id) }),
      ).toBeDefined();
    });

    it("keeps Events in a closed Semester — not deletable", async () => {
      const governor = await seedActor("governor");
      authAs(governor);
      const semester = await openSemester();
      const created = await request(server())
        .post("/event/create")
        .set("Authorization", bearer)
        .send({
          name: "Foundation Day",
          date: "2026-07-15",
          type: "half_day",
          halfDayPenaltyAmount: "50.00",
        });
      await request(server())
        .post("/semester/close")
        .set("Authorization", bearer)
        .send({ id: semester.id });

      const response = await request(server())
        .post("/event/delete")
        .set("Authorization", bearer)
        .send({ id: created.body.id });
      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Closed Semester Events cannot be deleted");
    });

    it("lists every Event regardless of which Officer created it (ADR-0007)", async () => {
      const creator = await seedActor("officer");
      const reader = await seedActor("officer");
      authAs(creator);
      await openSemester();
      await request(server())
        .post("/event/create")
        .set("Authorization", bearer)
        .send({
          name: "Foundation Day",
          date: "2026-07-15",
          type: "half_day",
          halfDayPenaltyAmount: "50.00",
        });

      authAs(reader);
      const response = await request(server())
        .post("/event/list")
        .set("Authorization", bearer)
        .send({});
      expect(response.status).toBe(201);
      expect(response.body).toHaveLength(1);
    });
  });
});
