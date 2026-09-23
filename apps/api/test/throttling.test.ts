import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Reflector } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { TOKEN_VERIFIER } from "../src/shared/domain/token-verifier";
import { STUDENT_REPOSITORY } from "../src/modules/student/domain/student-repository";
import { AuthGuard } from "../src/shared/presentation/auth.guard";
import { CapabilityGuard } from "../src/shared/presentation/capability.guard";
import { TokenAuthGuard } from "../src/shared/presentation/token-auth.guard";
import { ReportController } from "../src/modules/report/presentation/report.controller";
import { ReportUseCase } from "../src/modules/report/application/report.use-case";
import { EnrollmentRosterController } from "../src/modules/enrollment-roster/presentation/enrollment-roster.controller";
import { ClaimRosterUseCase } from "../src/modules/enrollment-roster/application/claim-roster.use-case";
import { createTestApp } from "./create-test-app";

// M-3: proves the two DAST-flagged abuse routes (report generation, roster
// claim) are rate-limited, and that the limiter is scoped to those
// controllers only — nothing here asserts anything about scan/attendance
// routes, which deliberately get no throttler.
describe("Rate limiting (M-3)", () => {
  const bearer = "Bearer token";

  describe("ReportController", () => {
    let app: INestApplication;
    beforeAll(async () => {
      app = await createTestApp(
        [ReportController],
        [
          { provide: TOKEN_VERIFIER, useValue: { verify: async () => ({ authUserId: "officer" }) } },
          {
            provide: STUDENT_REPOSITORY,
            useValue: {
              findByAuthUserId: async () => ({
                id: "actor-1", studentId: "24-001", authUserId: "officer",
                email: "o@example.com", name: "Officer", role: "officer", program: "Computer Science",
              }),
            },
          },
          { provide: ReportUseCase, useValue: { perSemester: async () => ({}) } },
          AuthGuard,
          CapabilityGuard,
          Reflector,
        ],
        [ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 30 }])],
      );
    });
    afterAll(async () => app.close());

    it("throttles after 10 requests per minute", async () => {
      const server = () => app.getHttpServer();
      const call = () => request(server()).post("/report/per-semester").set("Authorization", bearer).send({ semesterId: "s1" });
      for (let i = 0; i < 10; i++) {
        await call().expect(201);
      }
      await call().expect(429);
    });
  });

  describe("EnrollmentRosterController", () => {
    let app: INestApplication;
    beforeAll(async () => {
      app = await createTestApp(
        [EnrollmentRosterController],
        [
          // Keyed on the bearer token so a test can prove the limit tracks
          // per-caller identity, not the shared loopback IP every supertest
          // request arrives from (the validation finding this guards against).
          { provide: TOKEN_VERIFIER, useValue: { verify: async (token: string) => ({ authUserId: token }) } },
          { provide: ClaimRosterUseCase, useValue: { execute: async () => { throw new Error("no-match"); } } },
          TokenAuthGuard,
          Reflector,
        ],
        [ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 30 }])],
      );
    });
    afterAll(async () => app.close());

    const claimAs = (server: () => import("http").Server, authUserId: string) =>
      request(server()).post("/enrollment-roster/claim").set("Authorization", `Bearer ${authUserId}`).send({ studentId: "24-001" });

    it("throttles after 5 requests per minute", async () => {
      const server = () => app.getHttpServer();
      for (let i = 0; i < 5; i++) {
        await claimAs(server, "user_1").expect(500);
      }
      await claimAs(server, "user_1").expect(429);
    });

    it("tracks the limit per caller identity, not per IP (IdentityThrottlerGuard)", async () => {
      const server = () => app.getHttpServer();
      for (let i = 0; i < 5; i++) {
        await claimAs(server, "user_2").expect(500);
      }
      await claimAs(server, "user_2").expect(429);
      // A different caller, same loopback IP as every request above, still
      // has a fresh budget — proves the key is identity, not IP.
      await claimAs(server, "user_3").expect(500);
    });
  });
});
