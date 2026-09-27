import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the real Department Fund layout (header + balance card + three figure
// cards) so navigation doesn't look broken while the summary read resolves.
export default function FinanceLoading() {
  return (
    <main
      data-testid="finance-loading"
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 bg-[var(--bg-page)] min-h-[calc(100vh-3rem)]"
    >
      <header className="flex flex-col gap-2">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </header>

      <Card className="rounded-[12px] border-2 border-border bg-card shadow-[var(--shadow-md)]">
        <CardHeader className="pb-2">
          <Skeleton className="h-3 w-32" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Skeleton className="h-12 w-56" />
          <Skeleton className="h-4 w-full max-w-xs" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="rounded-[12px] border-2 border-border bg-card shadow-[var(--shadow-md)]">
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
