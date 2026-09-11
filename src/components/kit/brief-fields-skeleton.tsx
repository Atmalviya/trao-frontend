import { Skeleton } from "@/components/ui/skeleton";

export function BriefFieldsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <div className="space-y-2 rounded-lg border border-accent/20 bg-muted/10 p-3">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-[96%]" />
          <Skeleton className="h-3.5 w-[88%]" />
          <Skeleton className="h-3.5 w-[72%]" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <div className="space-y-2 rounded-lg border border-accent/20 bg-muted/10 p-3">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-[94%]" />
          <Skeleton className="h-3.5 w-[80%]" />
          <Skeleton className="h-3.5 w-[65%]" />
        </div>
      </div>
    </div>
  );
}
