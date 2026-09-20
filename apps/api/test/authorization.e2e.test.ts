import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { Test } from "@nestjs/testing";
import { Reflector } from "@nestjs/core";
import { Controller, Get, INestApplication, UseGuards } from "@nestjs/common";
import request from "supertest";
import { TOKEN_VERIFIER } from "../src/shared/domain/token-verifier";
import { STUDENT_REPOSITORY } from "../src/modules/student/domain/student-repository";
import { PROGRAM_REPOSITORY } from "../src/modules/program/domain/program-repository";
import { GetCallerIdentityUseCase } from "../src/modules/student/application/get-caller-identity.use-case";
import { CorrectStudentUseCase } from "../src/modules/student/application/correct-student.use-case";
import { ListStudentsUseCase } from "../src/modules/student/application/list-students.use-case";
import { PromoteStudentUseCase } from "../src/modules/student/application/promote-student.use-case";
import { StudentController } from "../src/modules/student/presentation/student.controller";
import { AuthGuard } from "../src/shared/presentation/auth.guard";
import { CapabilityGuard } from "../src/shared/presentation/capability.guard";
import { RequireCapability } from "../src/shared/presentation/capability.decorator";
import type { Actor } from "../src/shared/domain/actor";

const STUDENT: Actor = {
  id: "00000000-0000-0000-0000-000000000002",
  studentId: "S-002",
  authUserId: "user_student",
  email: "student@example.edu",
  name: "Sam Student",
  role: "student",
  program: "BS Computer Science",
};

// A capability real students never hold, so the guard's forbidden branch is
// exercised against genuine domain data rather than a fabricated role.
@Controller("test-only")
@UseGuards(AuthGuard, CapabilityGuard)
class AdminOnlyController {
  @Get("admin")
  @RequireCapability("administer")
  admin() {
    return { ok: true };
  }
}

// Seam 3 (parent issue #157): the only new seam this rewrite adds. Kept
// deliberately small — one file, not a suite per route. Everything below
// is unreachable at the use-case seam, where the actor is already an
// object: a valid token resolves an actor, an invalid one is unauthenticated,
// an authenticated actor lacking the capability is forbidden.

const GOVERNOR: Actor = {
  id: "00000000-0000-0000-0000-000000000001",
  studentId: "S-001",
  authUserId: "user_governor",
  email: "governor@example.edu",
  name: "Gigi Governor",
  role: "governor",
  program: "BS Computer Science",
};

describe("authorization boundary", () => {
  let app: INestApplication;
  const verify = vi.fn();
  const findByAuthUserId = vi.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [StudentController, AdminOnlyController],
      providers: [
        { provide: TOKEN_VERIFIER, useValue: { verify } },
        {
          provide: STUDENT_REPOSITORY,
          useValue: { findByAuthUserId, listAll: vi.fn(), promoteToOfficer: vi.fn() },
        },
        { provide: PROGRAM_REPOSITORY, useValue: { listNames: vi.fn() } },
        GetCallerIdentityUseCase,
        CorrectStudentUseCase,
        ListStudentsUseCase,
        PromoteStudentUseCase,
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

  it("resolves the caller's identity for a valid token", async () => {
    verify.mockResolvedValueOnce({ authUserId: GOVERNOR.authUserId });
    findByAuthUserId.mockResolvedValue(GOVERNOR);

    const response = await request(app.getHttpServer())
      .post("/student/identity")
      .set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      studentId: GOVERNOR.studentId,
      authUserId: GOVERNOR.authUserId,
      email: GOVERNOR.email,
      name: GOVERNOR.name,
      role: GOVERNOR.role,
      program: GOVERNOR.program,
    });
  });

  it("refuses a missing token as unauthenticated", async () => {
    const response = await request(app.getHttpServer()).post("/student/identity");
    expect(response.status).toBe(401);
  });

  it.each(["expired", "tampered", "foreign-signed"])(
    "refuses a %s token identically as unauthenticated",
    async () => {
      verify.mockResolvedValueOnce(null);

      const response = await request(app.getHttpServer())
        .post("/student/identity")
        .set("Authorization", "Bearer bad-token");

      expect(response.status).toBe(401);
    },
  );

  it("refuses an authenticated actor lacking the capability as forbidden", async () => {
    verify.mockResolvedValueOnce({ authUserId: STUDENT.authUserId });
    findByAuthUserId.mockResolvedValueOnce(STUDENT);

    const response = await request(app.getHttpServer())
      .get("/test-only/admin")
      .set("Authorization", "Bearer valid-student-token");

    expect(response.status).toBe(403);
  });
});
