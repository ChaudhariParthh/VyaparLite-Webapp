import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, BarChart3, ShieldCheck } from "lucide-react";
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

const FEATURES = [
  { icon: ArrowUp, title: "Quick entries", body: "Add a sale or a bill in a few taps — cash, UPI, card or bank." },
  { icon: BarChart3, title: "Clear reports", body: "Monthly trends and category breakdowns, exportable to CSV." },
  { icon: ShieldCheck, title: "Private by default", body: "Only you can see your business records." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <Button asChild variant="ghost"><Link to="/auth" search={{ redirect: undefined }}>Sign in</Link></Button>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-20">
        <div className="max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            Made for kirana, retail & service businesses
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Know where your <span className="text-income">money comes in</span> and <span className="text-expense">goes out</span>.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            VyaparLite records your income and expenses and shows your net cash flow in rupees — no accounting knowledge needed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/auth" search={{ redirect: undefined }}>Get started free</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/dashboard">Go to dashboard</Link></Button>
          </div>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-5 shadow-card">
              <f.icon className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="mt-3 font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
          <ArrowDown className="h-3 w-3" aria-hidden /> VyaparLite tracks cash flow; it is not a full accounting or tax tool.
        </p>
      </main>
    </div>
  );
}
