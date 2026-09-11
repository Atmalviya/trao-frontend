import { cn } from "@/lib/cn";

export function ShimmerText({
  children,
  active = false,
  className,
}: {
  children: string;
  active?: boolean;
  className?: string;
}) {
  if (!active) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span
      className={cn(
        "shimmer-text inline-block bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
}
