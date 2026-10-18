import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BarChart3, Home, LogOut, Settings, Tags, ArrowLeftRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Business } from "@/lib/data";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ business, children }: { business: Business; children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <div className="px-2 py-2"><Logo /></div>
        <nav className="mt-6 flex flex-col gap-1" aria-label="Main">
          {NAV.map((n) => {
            const active = path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-muted",
                )}
              >
                <n.icon className="h-4 w-4" aria-hidden />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border bg-card p-3">
          <p className="truncate text-sm font-semibold">{business.name}</p>
          <p className="truncate text-xs text-muted-foreground">{business.business_type}</p>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start px-2" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-card/90 px-4 py-3 backdrop-blur md:hidden">
          <Logo />
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground" aria-label={business.name}>
            {business.name.charAt(0).toUpperCase()}
          </span>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-10 md:pt-8">{children}</main>
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card md:hidden">
          {NAV.map((n) => {
            const active = path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
                <n.icon className="h-5 w-5" aria-hidden />
                {n.label === "Transactions" ? "Txns" : n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
