import { myAttendanceSnapshot } from "./actions";
import { MyAttendanceView } from "./my-attendance-view";

export const dynamic = "force-dynamic";

export default async function MyAttendancePage() {
  // Server shell still does the read, so a cold visit's source has the Ledger
  // figures in it; the client child seeds its cache from this result (ADR 0013).
  const snapshot = await myAttendanceSnapshot();
  return <MyAttendanceView initialData={snapshot} />;
}
