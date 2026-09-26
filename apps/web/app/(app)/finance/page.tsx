import { financeSummary, listExpenseCategories, listExpenses } from "./actions";
import { FinanceView } from "./finance-view";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  // Server shell still does the reads, so a cold visit's source has the Fund
  // figures and Expense list in it; the client child seeds its caches from
  // these results (ADR 0013). Categories fill the record form's picker.
  const [summary, expenses, categories] = await Promise.all([
    financeSummary(),
    listExpenses(),
    listExpenseCategories(),
  ]);
  return <FinanceView initialData={summary} initialExpenses={expenses} categories={categories} />;
}
