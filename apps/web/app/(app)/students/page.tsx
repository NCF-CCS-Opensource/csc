import { studentsSnapshot } from "./actions";
import { StudentsView } from "./students-view";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  // Server shell still does the read, so a cold visit's source has the roster
  // in it; the client child seeds its cache from this result (ADR 0013).
  const snapshot = await studentsSnapshot();
  return <StudentsView initialData={snapshot} />;
}
