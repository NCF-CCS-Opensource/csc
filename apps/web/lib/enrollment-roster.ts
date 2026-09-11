import { enrollmentRoster, students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { rosterNameMatches } from "./onboarding";
import { determineRole } from "./roles";

type Identity = { authUserId: string; email: string; name: string };

const GOVERNOR_EMAILS = (process.env.GOVERNOR_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

async function createStudentFromRoster(
  identity: Identity,
  roster: typeof enrollmentRoster.$inferSelect,
) {
  const [student] = await db
    .insert(students)
    .values({
      authUserId: identity.authUserId,
      email: identity.email.toLowerCase(),
      name: [roster.firstName, roster.middleName, roster.lastName].filter(Boolean).join(" "),
      program: roster.program,
      section: roster.section,
      studentId: roster.studentId,
      role: determineRole(identity.email, GOVERNOR_EMAILS),
    })
    .onConflictDoNothing()
    .returning({ id: students.id });
  return student;
}

// An exact verified GBox address is sufficient to claim its corresponding
// roster row. This is used before rendering onboarding at all.
export async function claimRosterByEmail(identity: Identity) {
  const roster = await db.query.enrollmentRoster.findFirst({
    where: eq(enrollmentRoster.email, identity.email.toLowerCase()),
  });
  return roster ? createStudentFromRoster(identity, roster) : undefined;
}

export async function claimRosterByStudentId(identity: Identity, studentId: string) {
  const roster = await db.query.enrollmentRoster.findFirst({
    where: eq(enrollmentRoster.studentId, studentId.trim()),
  });
  if (!roster || !rosterNameMatches(identity.name, roster)) return undefined;
  return createStudentFromRoster(identity, roster);
}
