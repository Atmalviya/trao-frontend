"use client";

import { Button } from "@/components/ui/button";
import { ShimmerText } from "@/components/ui/shimmer";
import { cn } from "@/lib/cn";
import { RefreshCw } from "lucide-react";
import type { ComponentProps } from "react";

type RegenerateButtonProps = Omit<ComponentProps<typeof Button>, "children"> & {
  isPending: boolean;
  idleLabel: string;
  pendingLabel?: string;
};

export function RegenerateButton({
  isPending,
  idleLabel,
  pendingLabel = "Regenerating…",
  className,
  disabled,
  ...props
}: RegenerateButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled || isPending}
      aria-busy={isPending}
      className={className}
      {...props}
    >
      <RefreshCw
        className={cn("h-4 w-4 shrink-0", isPending && "animate-spin")}
        aria-hidden
      />
      {isPending ? (
        <ShimmerText active className="text-sm">
          {pendingLabel}
        </ShimmerText>
      ) : (
        idleLabel
      )}
    </Button>
  );
}
