"use client";

import { useQuery } from "@tanstack/react-query";
import type { DepartmentFundSummary } from "@attendance/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { financeSummary } from "./actions";
import { financeQueryKey } from "./query-key";

// Plain peso with two decimals; a negative amount keeps its minus sign, never
// accounting-style parentheses (issue #346: a negative balance is shown plainly).
function peso(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}₱${Math.abs(amount).toFixed(2)}`;
}

function FigureCard({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Card className="border-2 border-border rounded-[12px] shadow-[var(--shadow-md)] bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-2xl font-bold tabular-nums text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

export function FinanceView({ initialData }: Readonly<{ initialData: DepartmentFundSummary }>) {
  // Seed the cache from the server shell's read; the queryFn re-runs on revisits
  // and whenever the key is invalidated (ADR 0013).
  const { data } = useQuery({
    queryKey: financeQueryKey,
    queryFn: financeSummary,
    initialData,
  });

  const negative = data.balance < 0;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 bg-[var(--bg-page)] min-h-[calc(100vh-3rem)]">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#888888]">
          CCS DEPARTMENT FUND
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground lowercase">
          department fund
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          The council&apos;s single running cash balance — collected SAF Fees plus collected Penalties, minus Expenses. Cumulative across all Semesters; it never resets.
        </p>
      </header>

      <Card className="border-2 border-border rounded-[12px] shadow-[var(--shadow-md)] bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Running balance
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <p
            data-testid="fund-balance"
            className={cn(
              "font-heading text-4xl sm:text-5xl font-extrabold tabular-nums",
              negative ? "text-red-600" : "text-foreground",
            )}
          >
            {peso(data.balance)}
          </p>
          <p className="text-sm text-muted-foreground">
            Un-voided Payments collected, minus un-voided Expenses.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FigureCard label="Collected SAF Fees" value={peso(data.collectedSafFees)} />
        <FigureCard label="Collected Penalties" value={peso(data.collectedPenalties)} />
        <FigureCard label="Total Expenses" value={peso(data.totalExpenses)} />
      </div>
    </main>
  );
}
