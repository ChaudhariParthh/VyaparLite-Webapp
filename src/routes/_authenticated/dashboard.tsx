import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness, useCategories, useTxnsInRange } from "@/lib/data";
import { currentMonthRange, formatDate, formatINR, monthlySeries, summarize, todayIST } from "@/lib/finance";
import { ChartLegend, DateRange, Empty, Figure, FlowBar, IncomeExpenseChart, LedgerRow, Section } from "@/components/app/widgets";
import { useEntry } from "@/components/app/AppShell";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview — VyaparLite" },
      { name: "description", content: "Your business income, expenses and net cash flow at a glance." },
      { property: "og:title", content: "Overview — VyaparLite" },
      { property: "og:description", content: "Your business income, expenses and net cash flow at a glance." },
    ],
  }),
  component: Dashboard,
});

function sixMonthsBack(to: string) {
  const [y, m] = to.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m - 6, 1)).toISOString().slice(0, 10);
}

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Dashboard() {
  const navigate = useNavigate();
  const { data: business } = useBusiness();
  const entry = useEntry();
  const [range, setRange] = useState(currentMonthRange());
  const bid = business?.id;
  const cats = useCategories(bid);
  const txns = useTxnsInRange(bid, range.from, range.to);
  const today = todayIST();
  const trendFrom = sixMonthsBack(today);
  const trend = useTxnsInRange(bid, trendFrom, today);

  const totals = useMemo(() => summarize(txns.data ?? []), [txns.data]);
  const series = useMemo(() => monthlySeries(trend.data ?? [], trendFrom, today), [trend.data, trendFrom, today]);
  const catName = Object.fromEntries((cats.data ?? []).map((c) => [c.id, c.name]));
  const recent = (txns.data ?? []).slice(0, 7);
  const count = txns.data?.length ?? 0;
  const keepRate = totals.income > 0 ? Math.round((totals.net / totals.income) * 100) : null;

  return (
    <div className="rise">
      {/* Masthead */}
      <div className="flex flex-col gap-4 border-b border-rule pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            aria-label="Back to home page"
            className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-rule text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
          <div className="min-w-0">
            <p className="eyebrow">{greeting()}</p>
            <h1 className="mt-1 truncate font-display text-3xl sm:text-4xl">{business?.name}</h1>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <DateRange from={range.from} to={range.to} onChange={setRange} />
          <div className="hidden gap-2 sm:flex">
            <Button variant="income" onClick={() => entry.add("income")} disabled={!entry.ready}><Plus /> Income</Button>
            <Button variant="expense" onClick={() => entry.add("expense")} disabled={!entry.ready}><Minus /> Expense</Button>
          </div>
        </div>
      </div>

      {/* Hero figure + split */}
      <div className="grid gap-8 border-b border-rule py-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          {txns.isLoading ? (
            <Skeleton className="h-28 w-3/4" />
          ) : (
            <>
              <Figure label="Net cash flow" value={totals.net} tone="ink" size="xl" />
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                {count === 0
                  ? "Nothing recorded for this period yet."
                  : <>From {count} {count === 1 ? "entry" : "entries"} between {formatDate(range.from)} and {formatDate(range.to)}.{keepRate !== null && totals.net >= 0 && <> You kept <strong className="text-foreground">{keepRate}%</strong> of what came in.</>}</>}
                {" "}<span className="whitespace-nowrap">Income minus expenses — not accounting profit.</span>
              </p>
            </>
          )}
        </div>
        <div className="space-y-5 lg:col-span-5 lg:border-l lg:border-rule lg:pl-12">
          {txns.isLoading ? <Skeleton className="h-28" /> : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Figure label="Money in" value={totals.income} tone="income" />
                <Figure label="Money out" value={totals.expense} tone="expense" />
              </div>
              <FlowBar income={totals.income} expense={totals.expense} />
            </>
          )}
          {txns.error && <p role="alert" className="text-sm text-destructive">Couldn't load transactions. Please refresh.</p>}
          <div className="grid grid-cols-2 gap-2 sm:hidden">
            <Button variant="income" size="lg" onClick={() => entry.add("income")} disabled={!entry.ready}><Plus /> Income</Button>
            <Button variant="expense" size="lg" onClick={() => entry.add("expense")} disabled={!entry.ready}><Minus /> Expense</Button>
          </div>
        </div>
      </div>

      {/* Chart + ledger */}
      <div className="grid gap-10 pt-8 lg:grid-cols-12 lg:gap-12">
        <Section title="Last six months" action={<ChartLegend />} className="lg:col-span-7">
          {trend.isLoading ? <Skeleton className="h-64" /> : <IncomeExpenseChart data={series} />}
        </Section>
        <Section
          title="Latest entries"
          className="lg:col-span-5"
          action={<Link to="/transactions" className="inline-flex items-center gap-1 text-xs font-semibold hover:underline">Open ledger <ArrowRight className="h-3 w-3" /></Link>}
        >
          {txns.isLoading ? (
            <Skeleton className="h-56" />
          ) : recent.length === 0 ? (
            <Empty title="Your ledger is empty" action={<Button variant="outline" size="sm" onClick={() => entry.add("income")} disabled={!entry.ready}><Plus /> Record first entry</Button>}>
              Record today's first sale or bill — it takes a few seconds.
            </Empty>
          ) : (
            <div>
              {recent.map((t) => (
                <LedgerRow key={t.id} type={t.type} title={t.description} meta={`${catName[t.category_id] ?? "—"} · ${formatDate(t.transaction_date)}`} amount={Number(t.amount)} />
              ))}
            </div>
          )}
        </Section>
      </div>
      <span className="sr-only">{formatINR(0)}</span>
    </div>
  );
}
