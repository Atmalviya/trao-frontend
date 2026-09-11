import { cn } from "@/lib/cn";
import { AlertCircle } from "lucide-react";
import { ReactNode } from "react";

export function Alert({
  title,
  children,
  variant = "error",
  className,
}: {
  title?: string;
  children: ReactNode;
  variant?: "error" | "warning" | "info";
  className?: string;
}) {
  const styles = {
    error: "border-destructive/40 bg-destructive/10 text-red-200",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    info: "border-border bg-muted text-foreground",
  };

  return (
    <div
      role="alert"
      className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm", styles[variant], className)}
    >
      <AlertCircle className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
      <div>
        {title ? <p className="font-medium">{title}</p> : null}
        <div className={title ? "mt-1 opacity-90" : undefined}>{children}</div>
      </div>
    </div>
  );
}
