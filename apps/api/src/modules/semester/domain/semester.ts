// See CONTEXT.md's Semester entry. At most one open (closedAt === null) at a
// time — enforced by a partial unique index (packages/db/src/schema.ts,
// `semesters_one_open`), not only by application code.
export interface Semester {
  id: string;
  startDate: string;
  endDate: string;
  closedAt: Date | null;
}
