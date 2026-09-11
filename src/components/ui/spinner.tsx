import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-5 w-5 animate-spin text-primary", className)}
      aria-hidden
    />
  );
}
