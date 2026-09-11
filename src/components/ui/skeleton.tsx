import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-muted/30 via-muted/55 to-muted/30 bg-[length:200%_100%] animate-shimmer-bar",
        className,
      )}
      aria-hidden
    />
  );
}
