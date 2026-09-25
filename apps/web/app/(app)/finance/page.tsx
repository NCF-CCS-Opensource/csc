import { financeSummary } from "./actions";
import { FinanceView } from "./finance-view";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  // Server shell still does the read, so a cold visit's source has the Fund
  // figures in it; the client child seeds its cache from this result (ADR 0013).
  const summary = await financeSummary();
  return <FinanceView initialData={summary} />;
}
