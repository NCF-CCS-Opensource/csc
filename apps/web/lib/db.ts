import { createDb } from "@attendance/db";

export const db = createDb(process.env.DATABASE_URL!);
