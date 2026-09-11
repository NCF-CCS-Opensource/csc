// Seeds all students from enrollment_roster into the students table for local testing
import postgres from "postgres";

const dbUrl =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

const { GOVERNOR_EMAILS = "governor@gbox.ncf.edu.ph" } = process.env;
if (!dbUrl) {
  console.error(
    "Missing DATABASE_URL/POSTGRES_URL. Run with: DATABASE_URL=... node scripts/seed-all-roster-students.mjs"
  );
  process.exit(1);
}

const governorList = GOVERNOR_EMAILS.split(",").map((e) => e.trim().toLowerCase());
const sql = postgres(dbUrl);

const roster = await sql`select * from enrollment_roster order by student_id`;
if (roster.length === 0) {
  console.error("No enrollment roster entries found! Run db:import-enrollment first.");
  await sql.end();
  process.exit(1);
}

console.log(`Found ${roster.length} roster rows. Syncing into students table...`);

let synced = 0;
await sql.begin(async (tx) => {
  for (const r of roster) {
    // If workbook row had no verified GBox email, synthesize a placeholder for local test data
    const email = (r.email || `student.${r.student_id.replace(/[^a-zA-Z0-9]/g, "")}@gbox.ncf.edu.ph`).toLowerCase();
    const name = [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(" ");
    const authUserId = `seed_${r.student_id}`;
    const role = governorList.includes(email) ? "governor" : "student";

    await tx`
      insert into students (auth_user_id, email, name, program, section, student_id, role)
      values (${authUserId}, ${email}, ${name}, ${r.program}, ${r.section}, ${r.student_id}, ${role})
      on conflict (student_id) do update set
        name = excluded.name,
        program = excluded.program,
        section = excluded.section,
        email = excluded.email
    `;
    synced++;
  }
});

console.log(`Successfully synced ${synced} students into students table.`);
await sql.end();
