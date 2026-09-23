import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const SKELETON_ROWS = 6;

export default function ClearanceLoading() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 bg-[var(--bg-page)] min-h-[calc(100vh-3rem)]">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96" />
      </header>

      <Card className="rounded-[10px] border-2 border-border bg-card p-5 shadow-[var(--shadow-md)]">
        <Skeleton className="h-10 w-full" />
      </Card>

      <Card
        data-testid="clearance-loading-table"
        className="rounded-[10px] border-2 border-border bg-card shadow-[var(--shadow-md)] overflow-hidden"
      >
        <CardHeader className="border-b-2 border-border bg-[var(--bg-page)] px-6 py-4 flex flex-row items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-4 gap-4 border-b-2 border-border px-6 py-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20 justify-self-end" />
          </div>
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <div
              key={`clearance-loading-row-${i}`}
              data-testid="clearance-loading-row"
              className="grid grid-cols-4 items-center gap-4 border-b border-border/20 px-6 py-3"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-24 justify-self-end" />
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
