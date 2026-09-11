// Imports the current CCS enrollment workbook into the pre-login roster.
// Run: pnpm --filter @attendance/db db:import-enrollment
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import postgres from "postgres";

const [source] = process.argv.slice(2);
if (!source || !process.env.DATABASE_URL) {
  console.error("Usage: DATABASE_URL=... node scripts/import-enrollment-roster.mjs <Enrollment List.xlsx>");
  process.exit(1);
}

const workbook = resolve(source);
const readZipEntry = (entry) => execFileSync("unzip", ["-p", workbook, entry], { encoding: "utf8" });
const decodeXml = (value) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const sharedStrings = [...readZipEntry("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map(
  ([, string]) =>
    decodeXml([...string.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(([, text]) => text).join("")),
);

const rows = [...readZipEntry("xl/worksheets/sheet1.xml").matchAll(
  /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g,
)].map(([, rowNumber, cells]) => {
  const row = { rowNumber: Number(rowNumber) };
  for (const [, column, attributes, body] of cells.matchAll(
    /<c[^>]*r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g,
  )) {
    const value = (body.match(/<v>([\s\S]*?)<\/v>/) ?? [, ""])[1];
    row[column] = attributes.includes('t="s"') ? sharedStrings[Number(value)] : decodeXml(value);
  }
  return row;
});

const PROGRAMS = {
  BSCS: "Computer Science",
  BSIT: "Information Technology",
  BSIS: "Information System",
  ACT: "ACT",
};
const trim = (value) => (value ?? "").trim();
const isGbox = (email) => /^[^\s@]+@gbox\.ncf\.edu\.ph$/i.test(email);
const roster = rows
  .filter((row) => /^\d+$/.test(trim(row.A)))
  .map((row) => {
    const program = PROGRAMS[trim(row.G)];
    if (!trim(row.B) || !program || !trim(row.C) || !trim(row.J)) {
      throw new Error(`Worksheet row ${row.rowNumber} has incomplete roster data`);
    }
    const email = trim(row.K).toLowerCase();
    return {
      email: isGbox(email) ? email : null,
      firstName: trim(row.D),
      lastName: trim(row.C),
      middleName: trim(row.E) || null,
      program,
      section: trim(row.J),
      studentId: trim(row.B),
    };
  });

if (new Set(roster.map((row) => row.studentId)).size !== roster.length) {
  throw new Error("The workbook contains duplicate Student IDs");
}
const gboxEmails = roster.flatMap((row) => (row.email ? [row.email] : []));
if (new Set(gboxEmails).size !== gboxEmails.length) {
  throw new Error("The workbook contains duplicate GBox emails");
}

const sql = postgres(process.env.DATABASE_URL);
try {
  await sql.begin(async (tx) => {
    for (const row of roster) {
      await tx`
        insert into enrollment_roster (email, first_name, last_name, middle_name, program, section, student_id)
        values (${row.email}, ${row.firstName}, ${row.lastName}, ${row.middleName}, ${row.program}, ${row.section}, ${row.studentId})
        on conflict (student_id) do update set
          email = excluded.email,
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          middle_name = excluded.middle_name,
          program = excluded.program,
          section = excluded.section
      `;
    }
  });
  console.log(`Imported ${roster.length} roster rows (${gboxEmails.length} exact GBox matches).`);
} finally {
  await sql.end();
}
