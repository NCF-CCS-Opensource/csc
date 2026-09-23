import { DecorativeAccents } from "@/components/decorative-accents";
import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <main
      className="relative flex flex-1 items-center justify-center overflow-hidden p-8"
      aria-busy="true"
      aria-label="Loading onboarding form"
    >
      <DecorativeAccents />
      <div className="w-full max-w-md rounded-[14px] border-2 border-border p-6 shadow-[var(--shadow-lg)]">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="size-12 rounded-full" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
      </div>
    </main>
  );
}
