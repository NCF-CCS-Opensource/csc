import { BentoCell, BentoGrid } from "@/components/ui/bento-grid";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8 bg-[var(--bg-page)] min-h-[calc(100vh-3rem)]">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-40" />
      </header>

      <BentoGrid className="w-full">
        <BentoCell colSpan={4} elevation="hero" className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-40 w-full rounded-[10px]" />
          <Skeleton className="h-24 w-full rounded-[10px]" />
        </BentoCell>

        <BentoCell colSpan={2} elevation="standard" className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-32 w-full rounded-[10px]" />
          <Skeleton className="h-9 w-full rounded-[8px]" />
        </BentoCell>

        <BentoCell colSpan={2} elevation="standard" className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-9 w-full rounded-[8px]" />
        </BentoCell>
      </BentoGrid>
    </main>
  );
}
