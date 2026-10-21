import type { ReactNode } from "react";
import { Logo } from "./Logo";

/** Split frame for sign-in, onboarding and password pages: ink editorial panel + paper form. */
export function AuthFrame({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-ink-foreground lg:flex">
        <Logo />
        <div className="max-w-md">
          <p className="figure text-7xl leading-none text-leaf">₹</p>
          <p className="mt-6 font-display text-4xl leading-tight">Financial clarity for people who run real businesses.</p>
          <p className="mt-4 text-sm text-ink-foreground/60">Record what comes in and what goes out. VyaparLite keeps the ledger; you keep running the shop.</p>
        </div>
        <p className="text-xs text-ink-foreground/40">Cash-flow tracking · not an accounting or tax tool</p>
      </aside>
      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="rise w-full max-w-sm">
          <div className="mb-10 lg:hidden"><Logo /></div>
          <h1 className="font-display text-3xl">{title}</h1>
          {lead && <p className="mt-2 text-sm text-muted-foreground">{lead}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
