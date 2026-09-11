import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ScheduleDaySkeleton() {
  return (
    <Card className="border-accent/20 bg-card/60" aria-hidden>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="ml-auto h-5 w-14" />
        </div>
        <Skeleton className="mt-2 h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-[88%] rounded-lg" />
      </CardContent>
    </Card>
  );
}
