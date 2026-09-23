import { BentoCell, BentoGrid } from "@/components/ui/bento-grid";
import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the real Dashboard's BentoGrid shape (1 hero, 2 wide, 4 small
// cells) so there's no layout jump once real content replaces this.
export default function DashboardLoading() {
  return (
    <BentoGrid>
      <BentoCell span="hero" elevation="hero" className="gap-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </BentoCell>
      <BentoCell span="wide" className="gap-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-24 w-full" />
      </BentoCell>
      <BentoCell span="wide" className="gap-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-24 w-full" />
      </BentoCell>
      <BentoCell span="small" className="gap-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-16 w-full" />
      </BentoCell>
      <BentoCell span="small" className="gap-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-16 w-full" />
      </BentoCell>
      <BentoCell span="small" className="gap-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-16 w-full" />
      </BentoCell>
      <BentoCell span="small" className="gap-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-16 w-full" />
      </BentoCell>
    </BentoGrid>
  );
}
