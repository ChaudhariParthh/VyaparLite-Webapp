import { createContext, useContext, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BarChart3, Home, List, LogOut, Plus, Settings, Tags } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories, type Business, type Txn } from "@/lib/data";
import type { TxnType } from "@/lib/finance";
import { Logo } from "./Logo";
import { TxnDialog } from "./TxnDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: Home },
  { to: "/transactions", label: "Ledger", icon: List },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

interface Entry {
  add: (type?: TxnType) => void;
  edit: (t: Txn) => void;
  ready: boolean;
}
const EntryCtx = createContext<Entry>({ add: () => {}, edit: () => {}, ready: false });
export const useEntry = () => useContext(EntryCtx);

export function AppShell({ business, children }: { business: Business; children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const cats = useCategories(business.id);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TxnType>("income");
  const [editing, setEditing] = useState<Txn | null>(null);

  const entry: Entry = {
    ready: !!cats.data,
    add: (t = "income") => { setEditing(null); setType(t); setOpen(true); },
    edit: (t) => { setEditing(t); setOpen(true); },
  };

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <EntryCtx.Provider value={entry}>
      <div className="min-h-screen w-full overflow-x-hidden">
        {/* Desktop masthead */}
        <header className="sticky top-0 z-30 bg-ink text-ink-foreground">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-10">
            <Link to="/dashboard" className="shrink-0 rounded-sm"><Logo /></Link>
            <nav aria-label="Main" className="hidden h-full items-stretch gap-1 md:flex">
              {NAV.map((n) => {
                const active = path.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center px-3 text-sm font-medium transition-colors",
                      active ? "text-ink-foreground" : "text-ink-foreground/60 hover:text-ink-foreground",
                    )}
                  >
                    {n.label}
                    <span className={cn("absolute inset-x-3 bottom-0 h-0.5 bg-leaf transition-transform origin-left", active ? "scale-x-100" : "scale-x-0")} />
                  </Link>
                );
              })}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden max-w-[14rem] truncate text-sm text-ink-foreground/70 lg:inline">{business.name}</span>
              <Button variant="leaf" size="sm" className="hidden md:inline-flex" onClick={() => entry.add()} disabled={!entry.ready}>
                <Plus /> New entry
              </Button>
              <button onClick={signOut} className="hidden rounded-sm p-1.5 text-ink-foreground/60 hover:text-ink-foreground md:block" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
              <span className="grid h-8 w-8 place-items-center rounded-full border border-ink-foreground/25 font-display text-sm md:hidden" aria-hidden>
                {business.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-16 md:pt-10 lg:px-10">{children}</main>

        {/* Mobile tab bar with central add */}
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          <div className="grid grid-cols-5 items-end">
            {[NAV[0], NAV[1]].map((n) => <TabLink key={n.to} {...n} active={path.startsWith(n.to)} />)}
            <div className="flex justify-center">
              <button
                onClick={() => entry.add()}
                disabled={!entry.ready}
                aria-label="New entry"
                className="-mt-5 grid h-14 w-14 place-items-center rounded-full bg-ink text-ink-foreground shadow-lift ring-4 ring-paper transition-transform active:scale-95 disabled:opacity-50"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
            {[NAV[2], NAV[4]].map((n) => <TabLink key={n.to} {...n} active={path.startsWith(n.to)} />)}
          </div>
        </nav>

        {cats.data && (
          <TxnDialog open={open} onOpenChange={setOpen} businessId={business.id} categories={cats.data} initialType={type} editing={editing} />
        )}
      </div>
    </EntryCtx.Provider>
  );
}

function TabLink({ to, label, icon: Icon, active }: { to: string; label: string; icon: typeof Home; active: boolean }) {
  return (
    <Link to={to} aria-current={active ? "page" : undefined} className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", active ? "text-foreground" : "text-muted-foreground")}>
      <Icon className="h-5 w-5" aria-hidden />
      <span className={cn("border-b-2 pb-0.5", active ? "border-leaf" : "border-transparent")}>{label}</span>
    </Link>
  );
}
