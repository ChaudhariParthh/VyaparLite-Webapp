import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VyaparLite — Simple cash flow tracking for Indian businesses" },
      { name: "description", content: "Record income and expenses in seconds and see your business cash flow in ₹." },
      { property: "og:title", content: "VyaparLite — Simple cash flow tracking for Indian businesses" },
      { property: "og:description", content: "Record income and expenses in seconds and see your business cash flow in ₹." },
    ],
  }),
  component: Index,
});

const POINTS = [
  { n: "01", title: "Record in seconds", body: "Amount first, then a tap for the category. Cash, UPI, card or bank." },
  { n: "02", title: "See the month clearly", body: "Money in, money out and what's left — month by month, category by category." },
  { n: "03", title: "Yours alone", body: "Each business's ledger is private to its owner. Export it to CSV whenever you need." },
];

function Index() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-10">
        <Logo />
        <Link to="/auth" className="text-sm font-semibold underline decoration-marigold decoration-2 underline-offset-4">Sign in</Link>
      </header>

      <main className="mx-auto max-w-7xl px-5 sm:px-10">
        <section className="grid gap-12 border-b border-rule pb-16 pt-10 lg:grid-cols-12 lg:pt-20">
          <div className="rise lg:col-span-7">
            <p className="eyebrow">For kirana, retail & service businesses</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.02] sm:text-7xl">
              Financial clarity for people who run <em className="text-income">real</em> businesses.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              VyaparLite is a simple ledger for what comes in and what goes out — so you always know your cash flow in rupees.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/auth">Start your ledger <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/dashboard">Open my overview</Link></Button>
            </div>
          </div>

          {/* Illustrative ledger excerpt — clearly a sample, not user data */}
          <figure className="rise self-end lg:col-span-5" aria-label="Sample ledger illustration">
            <div className="rounded-md bg-ink p-6 text-ink-foreground shadow-lift sm:p-8">
              <p className="eyebrow text-ink-foreground/50">Sample · net cash flow</p>
              <p className="figure mt-2 text-5xl text-marigold">₹38,400</p>
              <div className="mt-6 space-y-3 text-sm">
                {[["Counter sales", "+₹12,500", true], ["Shop rent", "−₹9,000", false], ["UPI — Mehta & Sons", "+₹4,200", true]].map(([d, a, inc]) => (
                  <div key={d as string} className="flex justify-between border-t border-ink-foreground/15 pt-3">
                    <span className="text-ink-foreground/80">{d}</span>
                    <span className="figure text-base">{a}</span>
                    <span className="sr-only">{inc ? "income" : "expense"}</span>
                  </div>
                ))}
              </div>
            </div>
            <figcaption className="mt-2 text-xs text-muted-foreground">Illustration only.</figcaption>
          </figure>
        </section>

        <section className="grid gap-10 py-16 md:grid-cols-3">
          {POINTS.map((p) => (
            <div key={p.n} className="border-t-2 border-foreground pt-4">
              <p className="figure text-sm text-muted-foreground">{p.n}</p>
              <h2 className="mt-2 font-display text-2xl">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </section>
        <p className="border-t border-rule py-8 text-xs text-muted-foreground">VyaparLite tracks cash flow. It is not an accounting, GST or tax tool.</p>
      </main>
    </div>
  );
}
