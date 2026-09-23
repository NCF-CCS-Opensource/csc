import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RejectionsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 bg-[var(--bg-page)] min-h-[calc(100vh-3rem)]">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80" />
      </header>

      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-[8px]" />
        <Skeleton className="h-9 w-20 rounded-[8px]" />
      </div>

      <div className="flex gap-3">
        <Skeleton className="h-8 w-32 rounded-[8px]" />
        <Skeleton className="h-8 w-32 rounded-[8px]" />
      </div>

      <Card className="border-2 border-border rounded-[12px] bg-card shadow-[var(--shadow-md)]">
        <CardHeader className="border-b-2 border-border/10">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-[10px]" />
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
