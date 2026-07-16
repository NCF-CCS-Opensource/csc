// Seeds 2 login-ready test Students (confirmed auth user + linked students row).
// Run:  pnpm --filter @attendance/db db:seed
// Idempotent: re-running updates the existing rows instead of duplicating.
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL } = process.env;
if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DATABASE_URL) {
  console.error("Missing env. Run via the db:seed script so --env-file=../../.env is applied.");
  process.exit(1);
}

const PASSWORD = "Password123!";
const PROGRAM = "Computer Science"; // must exist in the programs table (migration-seeded)
const TEST_STUDENTS = [
  { email: "teststudent1@gbox.ncf.edu.ph", name: "Test Student One", studentId: "24-00001" },
  { email: "teststudent2@gbox.ncf.edu.ph", name: "Test Student Two", studentId: "24-00002" },
];

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const sql = postgres(DATABASE_URL);

async function authUserIdFor(email) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true, // login-ready immediately, no email round-trip
  });
  if (!error) return data.user.id;
  // ponytail: naive listUsers scan (first page, ~50 users) — fine for a seed,
  // paginate if the project ever outgrows one page.
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw listErr;
  const found = list.users.find((u) => u.email === email);
  if (!found) throw error;
  return found.id;
}

for (const s of TEST_STUDENTS) {
  const authUserId = await authUserIdFor(s.email);
  await sql`
    insert into students (auth_user_id, email, name, program, student_id, role)
    values (${authUserId}, ${s.email}, ${s.name}, ${PROGRAM}, ${s.studentId}, 'student')
    on conflict (email) do update
      set auth_user_id = excluded.auth_user_id,
          name        = excluded.name,
          program     = excluded.program,
          student_id  = excluded.student_id
  `;
  console.log(`seeded ${s.email}  (password: ${PASSWORD})`);
}

await sql.end();
console.log("done — both are role=student. Promote one to Officer via the Governor Admin page.");
process.exit(0);
