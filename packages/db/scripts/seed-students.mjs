// Seeds 3 test Student rows. Run:  pnpm --filter @attendance/db db:seed
// Idempotent: re-running updates the existing rows instead of duplicating.
//
// Identities live in Clerk now (ADR 0012), and Clerk user ids only exist once
// somebody has actually signed in with Google — so this seeds data fixtures,
// not sign-in-able accounts. To exercise a real session, sign in through
// /sign-in and complete onboarding; to promote a seeded row, use the Admin page.
import postgres from "postgres";

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error("Missing env. Run via the db:seed script so --env-file=../../.env is applied.");
  process.exit(1);
}

const PROGRAM = "Computer Science"; // must exist in the programs table (migration-seeded)
const TEST_STUDENTS = [
  { email: "teststudent1@gbox.ncf.edu.ph", name: "Test Student One", studentId: "24-00001" },
  { email: "teststudent2@gbox.ncf.edu.ph", name: "Test Student Two", studentId: "24-00002" },
  { email: "teststudent3@gbox.ncf.edu.ph", name: "Test Student Three", studentId: "24-00003" },
];

const sql = postgres(DATABASE_URL);

for (const s of TEST_STUDENTS) {
  // Namespaced so a seeded row can never collide with a real Clerk user id.
  const authUserId = `seed_${s.studentId}`;
  await sql`
    insert into students (auth_user_id, email, name, program, student_id, role)
    values (${authUserId}, ${s.email}, ${s.name}, ${PROGRAM}, ${s.studentId}, 'student')
    on conflict (email) do update
      set auth_user_id = excluded.auth_user_id,
          name        = excluded.name,
          program     = excluded.program,
          student_id  = excluded.student_id
  `;
  console.log(`seeded ${s.email}`);
}

await sql.end();
console.log("done — all role=student. Promote one to Officer via the Governor Admin page.");
process.exit(0);
