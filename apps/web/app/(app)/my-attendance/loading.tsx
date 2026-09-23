import { Skeleton } from "@/components/ui/skeleton";
import { BentoCell, BentoGrid } from "@/components/ui/bento-grid";

export default function MyAttendanceLoading() {
  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8 bg-[var(--bg-page)] min-h-[calc(100vh-3rem)]">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96" />
      </header>

      <BentoGrid data-testid="attendance-bento-grid-skeleton" className="w-full">
        <BentoCell span="hero" elevation="hero" className="flex flex-col gap-6">
          <Skeleton className="h-24 w-full rounded-[12px]" />
          <Skeleton className="h-24 w-full rounded-[12px]" />
        </BentoCell>

        <BentoCell span="wide" elevation="standard" className="flex flex-col gap-4">
          <Skeleton className="h-32 w-full rounded-[12px]" />
        </BentoCell>

        <BentoCell span="wide" elevation="standard" className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-24 w-full rounded-[12px]" />
        </BentoCell>

        <BentoCell
          span="wide"
          colSpan={4}
          elevation="standard"
          className="col-span-4 max-[900px]:col-span-2 max-[520px]:col-span-1 flex flex-col gap-4"
        >
          <Skeleton className="h-6 w-56" />
          <div
            data-testid="attendance-history-skeleton-rows"
            className="flex flex-col gap-2"
          >
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-[8px]" />
            ))}
          </div>
        </BentoCell>
      </BentoGrid>
    </main>
  );
}
