import { Module, Global } from "@nestjs/common";
import { createDb } from "@attendance/db";

export const DB = Symbol("Db");

// createDb bounds the pool at 10 connections and enables prepared statements
// by default (packages/db/src/client.ts, #158) — the prefactor ticket
// referenced by this ticket's acceptance criteria. Nothing here overrides it.
@Global()
@Module({
  providers: [
    {
      provide: DB,
      useFactory: () => createDb(process.env.DATABASE_URL!),
    },
  ],
  exports: [DB],
})
export class DbModule {}
