"use client";

import { useState, useTransition } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { DepartmentFundSummary, ExpenseListItem } from "@attendance/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { financeSummary, listExpenses, recordExpense, voidExpense } from "./actions";
import { expensesQueryKey, financeQueryKey } from "./query-key";

// Plain peso with two decimals; a negative amount keeps its minus sign, never
// accounting-style parentheses (issue #346: a negative balance is shown plainly).
function peso(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}₱${Math.abs(amount).toFixed(2)}`;
}

// Recording or voiding an Expense moves the Fund and the list together, so
// both caches refresh in the same round trip (ADR 0013).
function refreshFinance(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: financeQueryKey }),
    queryClient.invalidateQueries({ queryKey: expensesQueryKey }),
  ]);
}

// Local calendar date (YYYY-MM-DD), not UTC — the council backdates in PH time,
// so a late-night entry must default to today here, not tomorrow in UTC.
function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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

// Record an Expense against the open Semester. On success it invalidates both
// the Fund and the Expense list so the balance drops and the row appears in
// the same round trip; the API's reason (no open Semester, unknown Category)
// is shown inline.
function RecordExpenseForm({ categories }: Readonly<{ categories: string[] }>) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [incurredOn, setIncurredOn] = useState(today);
  const [category, setCategory] = useState(categories[0] ?? "");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => recordExpense({ amount, description, incurredOn, category }),
    onSuccess: async (result) => {
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setAmount("");
      setDescription("");
      setIncurredOn(today());
      await refreshFinance(queryClient);
    },
  });

  const invalid = !amount || Number(amount) <= 0 || !description.trim() || !category || !incurredOn;

  return (
    <Card className="border-2 border-border rounded-[12px] shadow-[var(--shadow-md)] bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Record an Expense
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!invalid) mutation.mutate();
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expense-amount">Amount</Label>
              <Input
                id="expense-amount"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expense-date">Date incurred</Label>
              <Input
                id="expense-date"
                type="date"
                value={incurredOn}
                onChange={(event) => setIncurredOn(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expense-description">Description</Label>
            <Input
              id="expense-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What was it spent on?"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expense-category">Category</Label>
            <select
              id="expense-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 w-full rounded-[8px] border-2 border-border bg-[var(--bg-surface)] px-3 text-sm shadow-[var(--shadow-sm)] outline-none focus-visible:border-[var(--color-primary)] disabled:opacity-50"
            >
              {categories.length === 0 ? (
                <option value="">No Categories — ask the Governor to add one</option>
              ) : (
                categories.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={invalid || mutation.isPending}>
              {mutation.isPending ? "Recording…" : "Record Expense"}
            </Button>
            {error ? (
              <output className="text-xs font-bold text-red-600 dark:text-red-400">{error}</output>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// One Expense row's Void button. Voiding stamps voidedAt/voidedBy on the API
// side and keeps the row; the list re-reads it as voided.
function VoidButton({ expense }: Readonly<{ expense: ExpenseListItem }>) {
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="xs"
        variant="outline"
        disabled={pending}
        aria-label={`Void the ${peso(Number(expense.amount))} ${expense.category} Expense`}
        onClick={() =>
          startTransition(async () => {
            const result = await voidExpense(expense.id);
            if (result.error) {
              setError(result.error);
              return;
            }
            setError(null);
            await refreshFinance(queryClient);
          })
        }
      >
        {pending ? "Voiding…" : "Void"}
      </Button>
      {error ? (
        <output className="text-xs font-bold text-red-600 dark:text-red-400">{error}</output>
      ) : null}
    </div>
  );
}

function ExpenseList({ initialExpenses }: Readonly<{ initialExpenses: ExpenseListItem[] }>) {
  const { data: expenses } = useQuery({
    queryKey: expensesQueryKey,
    queryFn: listExpenses,
    initialData: initialExpenses,
  });

  return (
    <Card className="border-2 border-border rounded-[12px] shadow-[var(--shadow-md)] bg-card overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Expenses this Semester
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {expenses.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No Expenses recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Recorded by</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow
                    key={expense.id}
                    data-testid={`expense-row-${expense.id}`}
                    className={cn(expense.voidedAt && "text-muted-foreground line-through")}
                  >
                    <TableCell className="whitespace-nowrap tabular-nums">{expense.incurredOn}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell className="whitespace-normal">{expense.description}</TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {peso(Number(expense.amount))}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{expense.recordedBy}</TableCell>
                    <TableCell className="text-right">
                      {expense.voidedAt ? (
                        <Badge variant="absent" className="shadow-[var(--shadow-sm)]">
                          Voided{expense.voidedBy ? ` by ${expense.voidedBy}` : ""}
                        </Badge>
                      ) : (
                        <VoidButton expense={expense} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FinanceView({
  initialData,
  initialExpenses,
  categories,
}: Readonly<{
  initialData: DepartmentFundSummary;
  initialExpenses: ExpenseListItem[];
  categories: string[];
}>) {
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

      {/* Outstanding receivables — deliberately set apart from the balance cards
          above and labelled expected-not-collected, so money owed is never read
          as cash on hand (issue #348). */}
      <Card className="border-2 border-dashed border-border rounded-[12px] bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Outstanding — expected, not yet collected
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <p data-testid="fund-outstanding" className="font-heading text-2xl font-bold tabular-nums text-foreground">
            {peso(data.outstanding.safFees + data.outstanding.penalties)}
          </p>
          <p className="text-sm text-muted-foreground">
            SAF Fees {peso(data.outstanding.safFees)} · Penalties {peso(data.outstanding.penalties)}. Receivables — NOT part of the running balance.
          </p>
        </CardContent>
      </Card>

      {/* Per-Semester spending breakdown: each term's full collections beside the
          Expenses tagged to it — a second lens, not expected to tie out to the
          continuous balance (issue #348). */}
      {data.semesterBreakdown.length > 0 && (
        <Card className="border-2 border-border rounded-[12px] shadow-[var(--shadow-md)] bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Per-Semester breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm" data-testid="fund-semester-breakdown">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2 font-semibold">Semester</th>
                  <th className="pb-2 text-right font-semibold">Collected</th>
                  <th className="pb-2 text-right font-semibold">Spent</th>
                </tr>
              </thead>
              <tbody>
                {data.semesterBreakdown.map((line) => (
                  <tr key={line.semesterId} className="border-t border-border">
                    <td className="py-2 text-foreground">{line.semesterName}</td>
                    <td className="py-2 text-right tabular-nums text-foreground">{peso(line.collected)}</td>
                    <td className="py-2 text-right tabular-nums text-foreground">{peso(line.spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="pt-3 text-sm text-muted-foreground">
              A Semester&apos;s full collections, not the continuous balance — the two are not expected to match.
            </p>
          </CardContent>
        </Card>
      )}

      <RecordExpenseForm categories={categories} />
      <ExpenseList initialExpenses={initialExpenses} />
    </main>
  );
}
