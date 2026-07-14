import { programs } from "@attendance/db";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { RegisterForm } from "./register-form";

// The Program list is Governor-editable — never statically cache this page.
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const rows = await db.select({ name: programs.name }).from(programs).orderBy(asc(programs.name));

  return <RegisterForm programs={rows.map((row) => row.name)} />;
}
