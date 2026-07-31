import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createDb } from "../src/client";
import { programs } from "../src/schema";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL is required");

const host = new URL(connectionString).hostname;
if (!["127.0.0.1", "localhost", "[::1]"].includes(host)) {
  throw new Error("Integration tests only run against disposable local Postgres");
}

const db = createDb(connectionString);

describe("disposable Postgres", () => {
  it("rolls back a failed Drizzle transaction", async () => {
    const name = `rollback-${randomUUID()}`;

    await expect(
      db.transaction(async (transaction) => {
        await transaction.insert(programs).values({ name });
        throw new Error("forced rollback");
      }),
    ).rejects.toThrow("forced rollback");

    expect(
      await db.query.programs.findFirst({ where: eq(programs.name, name) }),
    ).toBeUndefined();
  });

  it("enforces schema constraints through Drizzle", async () => {
    const name = `unique-${randomUUID()}`;
    await db.insert(programs).values({ name });

    await expect(db.insert(programs).values({ name })).rejects.toMatchObject({
      code: "23505",
    });
  });
});
