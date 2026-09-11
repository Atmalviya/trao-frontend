"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { api } from "@/lib/api";
import type { KitStatus, KitSummary } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronRight, FolderOpen, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function statusTone(status: KitStatus) {
  if (status === "ready") return "success" as const;
  if (status === "generating") return "warning" as const;
  return "muted" as const;
}

function KitRow({ kit }: { kit: KitSummary }) {
  const title = kit.role || kit.company || "Untitled role";
  const subtitle = kit.company || kit.companyUrl;

  return (
    <Link
      href={`/kits/${kit.id}`}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-3.5 transition-colors duration-200 hover:border-accent/40 hover:bg-muted/40 cursor-pointer"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate font-semibold">{title}</h2>
          <Badge tone={statusTone(kit.status)}>{kit.status}</Badge>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          {kit.days} day{kit.days === 1 ? "" : "s"} · Updated{" "}
          {new Date(kit.updatedAt).toLocaleDateString()}
        </p>
      </div>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ["kits"],
    queryFn: () => api.listKits(),
  });

  const kits = data?.kits ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Your kits</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Interview prep tailored to each role you are pursuing
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => router.push("/kits/new")}>
          <Plus className="h-4 w-4" aria-hidden />
          New kit
        </Button>
      </div>

      <div className="app-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : error ? (
          <Alert title="Could not load kits">
            {error instanceof Error ? error.message : "Something went wrong"}
          </Alert>
        ) : kits.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No kits yet"
            description="Paste a job description and company URL to generate your first interview prep kit."
            action={
              <Button type="button" size="sm" onClick={() => router.push("/kits/new")}>
                Create your first kit
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2.5 pb-1" role="list">
            {kits.map((kit) => (
              <li key={kit.id}>
                <KitRow kit={kit} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
