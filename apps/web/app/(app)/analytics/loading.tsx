import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the real Analytics report layout (header + report config card) so
// navigation doesn't look broken while the page's data fetches resolve.
export default function AnalyticsLoading() {
  return (
    <main
      data-testid="analytics-loading"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 bg-[var(--bg-page)] min-h-[calc(100vh-3rem)]"
    >
      <header className="flex flex-col gap-2">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-full max-w-md" />
      </header>

      <Card className="rounded-[10px] border-2 border-border bg-card shadow-[var(--shadow-md)] overflow-hidden">
        <CardHeader className="bg-[var(--bg-page)] border-b-2 border-border px-6 py-4">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </CardHeader>
        <CardContent className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-2 max-w-sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 max-w-2xl">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <Skeleton className="h-11 w-48" />
        </CardContent>
      </Card>
    </main>
  );
}
