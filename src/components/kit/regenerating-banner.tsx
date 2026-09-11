import { ShimmerText } from "@/components/ui/shimmer";
import { Sparkles } from "lucide-react";

export function RegeneratingBanner({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-accent"
    >
      <Sparkles className="h-4 w-4 shrink-0 animate-pulse" aria-hidden />
      <ShimmerText active>{label}</ShimmerText>
    </div>
  );
}
