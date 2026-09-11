import { createDb } from "@attendance/db";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "postgresql://postgres:postgres@localhost:5432/placeholder";

export const db = createDb(connectionString);

