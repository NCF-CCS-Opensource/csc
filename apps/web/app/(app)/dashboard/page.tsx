import { dashboardSnapshot } from "./actions";
import { DashboardView } from "./dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Server shell still does the read, so a cold visit's source has the figures
  // in it; the client child seeds its cache from this result (ADR 0013).
  const snapshot = await dashboardSnapshot();
  return <DashboardView initialData={snapshot} />;
}
