import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness, useCategories, useTxnsInRange } from "@/lib/data";
import { currentMonthRange, formatDate, formatINR, monthlySeries, summarize, todayIST, type TxnType } from "@/lib/finance";
import { DateRange, Empty, IncomeExpenseChart, PageHeader, Panel, StatCard } from "@/components/app/widgets";
import { TxnDialog } from "@/components/app/TxnDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — VyaparLite" },
      { name: "description", content: "Your business income, expenses and net cash flow at a glance." },
      { property: "og:title", content: "Dashboard — VyaparLite" },
      { property: "og:description", content: "Your business income, expenses and net cash flow at a glance." },
    ],
  }),
  component: Dashboard,
});

function sixMonthsBack(to: string) {
  const [y, m] = to.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 6, 1));
  return d.toISOString().slice(0, 10);
}

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Dashboard() {
  const { data: business } = useBusiness();
  const [range, setRange] = useState(currentMonthRange());
  const [dialog, setDialog] = useState<TxnType | null>(null);
  const bid = business?.id;
  const cats = useCategories(bid);
  const txns = useTxnsInRange(bid, range.from, range.to);
  const today = todayIST();
  const trendFrom = sixMonthsBack(today);
  const trend = useTxnsInRange(bid, trendFrom, today);

  const totals = useMemo(() => summarize(txns.data ?? []), [txns.data]);
  const series = useMemo(() => monthlySeries(trend.data ?? [], trendFrom, today), [trend.data, trendFrom, today]);
  const catName = Object.fromEntries((cats.data ?? []).map((c) => [c.id, c.name]));
  const recent = (txns.data ?? []).slice(0, 6);

  return (
    <>
      <PageHeader
        title={business?.name ?? ""}
        subtitle={`${greeting()}! Here's your business overview.`}
        actions={<DateRange from={range.from} to={range.to} onChange={setRange} />}
      />
      <div className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <Button onClick={() => setDialog("income")} disabled={!cats.data}><Plus /> Add income</Button>
        <Button variant="outline" onClick={() => setDialog("expense")} disabled={!cats.data} className="border-primary text-primary"><Plus /> Add expense</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {txns.isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          <>
            <StatCard label="Total income" value={totals.income} tone="income" icon={<ArrowUp className="h-5 w-5" />} />
            <StatCard label="Total expenses" value={totals.expense} tone="expense" icon={<ArrowDown className="h-5 w-5" />} />
            <StatCard label="Net cash flow" value={totals.net} tone="info" icon={<TrendingUp className="h-5 w-5" />} hint="Income minus expenses (not profit)" />
          </>
        )}
      </div>
      {txns.error && <p role="alert" className="mt-4 text-sm text-destructive">Couldn't load transactions. Please refresh.</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Panel title="Income vs expenses · last 6 months" className="lg:col-span-3">
          {trend.isLoading ? <Skeleton className="h-64" /> : <IncomeExpenseChart data={series} />}
        </Panel>
        <Panel title="Recent transactions" className="lg:col-span-2" action={<Link to="/transactions" className="text-sm font-medium text-primary hover:underline">View all</Link>}>
          {txns.isLoading ? (
            <Skeleton className="h-48" />
          ) : recent.length === 0 ? (
            <Empty title="No transactions in this period">Add your first income or expense to get started.</Empty>
          ) : (
            <ul className="divide-y">
              {recent.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", t.type === "income" ? "bg-income-soft text-income" : "bg-expense-soft text-expense")}>
                    {t.type === "income" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.description}</p>
                    <p className="truncate text-xs text-muted-foreground">{catName[t.category_id] ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-semibold", t.type === "income" ? "text-income" : "text-expense")}>
                      {t.type === "income" ? "+" : "−"}{formatINR(Number(t.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.transaction_date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {bid && cats.data && (
        <TxnDialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)} businessId={bid} categories={cats.data} initialType={dialog ?? "income"} />
      )}
    </>
  );
}
