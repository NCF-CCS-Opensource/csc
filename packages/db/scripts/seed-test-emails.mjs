// Seeds enrollment_roster rows for ONBOARDING_TEST_EMAILS so those addresses
// can sign in for real (Clerk allowlist exception, see onboarding.ts) and
// land on /onboarding to an instant auto-claim by email — no Student ID entry
// needed. This is how you test the Student flow without a second GBox
// account: seeded `students` rows (db:seed) aren't sign-in-able because
// their auth_user_id isn't a real Clerk id.
// Run: pnpm --filter @attendance/db db:seed-test-emails
import postgres from "postgres";

const dbUrl =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!dbUrl) {
  console.error("Missing database URL. Run via db:seed-test-emails so --env-file=../../.env is applied.");
  process.exit(1);
}

const testEmails = (process.env.ONBOARDING_TEST_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

if (testEmails.length === 0) {
  console.error("ONBOARDING_TEST_EMAILS is empty — nothing to seed.");
  process.exit(1);
}

const PROGRAM = "Computer Science"; // must exist in the programs table (migration-seeded)

const sql = postgres(dbUrl);

let i = 1;
for (const email of testEmails) {
  const studentId = `TEST-${String(i).padStart(3, "0")}`;
  await sql`
    insert into enrollment_roster (email, first_name, last_name, program, section, student_id)
    values (${email}, ${"Test"}, ${`Tester ${i}`}, ${PROGRAM}, ${"TEST"}, ${studentId})
    on conflict (email) do update
      set student_id = excluded.student_id,
          program    = excluded.program,
          section    = excluded.section
  `;
  console.log(`roster row ready for ${email} (studentId ${studentId})`);
  i++;
}

await sql.end();
console.log("done — sign in with one of these emails, then visit /onboarding to auto-claim.");
process.exit(0);
