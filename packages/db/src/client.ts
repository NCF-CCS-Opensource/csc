import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const MAX_CONNECTIONS = 10;

export interface CreateDbOptions {
  /** Set to false only for a deployment behind a transaction pooler (e.g. Supavisor). */
  prepare?: boolean;
}

export function createDb(connectionString: string, options: CreateDbOptions = {}) {
  const { prepare = true } = options;
  const client = postgres(connectionString, { prepare, max: MAX_CONNECTIONS });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;
