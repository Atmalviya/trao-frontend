"use client";

import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/cn";
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Button } from "./ui/button";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kits/new", label: "New kit", icon: Plus },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold text-foreground"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-accent">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <span className="hidden sm:inline">Prep Kit</span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Main">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground md:inline">
              {user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void logout()}
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>

      <main
        id="main"
        className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6"
      >
        {children}
      </main>

      <footer className="flex h-6 shrink-0 items-center justify-center gap-1 border-t border-border/60 bg-background/40 px-4 text-[10px] leading-none text-muted-foreground/65">
        <BookOpen className="h-2.5 w-2.5 shrink-0 opacity-45" aria-hidden />
        <span>Research-backed interview prep</span>
      </footer>
    </div>
  );
}
