import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

export function QuestionItemSkeleton({ className }: { className?: string }) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-accent/20 bg-card/60",
        className,
      )}
      aria-hidden
    >
      <div className="flex gap-2 p-3">
        <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-14" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[92%]" />
          <Skeleton className="h-4 w-[78%]" />
          <Skeleton className="mt-1 h-3 w-28" />
        </div>
      </div>
      <div className="border-t border-border/40 px-3 py-2">
        <Skeleton className="h-8 w-24" />
      </div>
    </article>
  );
}
