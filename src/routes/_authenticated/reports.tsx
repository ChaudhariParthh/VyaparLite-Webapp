import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness, useCategories, useTxnsInRange } from "@/lib/data";
import { categoryBreakdown, currentMonthRange, formatINR, monthlySeries, paymentLabel, summarize, toCSV } from "@/lib/finance";
import { ChartLegend, DateRange, Empty, Figure, IncomeExpenseChart, NetTrendChart, PageHeader, Section } from "@/components/app/widgets";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — VyaparLite" },
      { name: "description", content: "Monthly trends, category breakdowns and CSV export of your records." },
      { property: "og:title", content: "Reports — VyaparLite" },
      { property: "og:description", content: "Monthly trends, category breakdowns and CSV export of your records." },
    ],
  }),
  component: Reports,
});

const COLORS = ["var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-1)", "var(--muted-foreground)"];

function Reports() {
  const { data: business } = useBusiness();
  const bid = business?.id;
  const [range, setRange] = useState(currentMonthRange());
  const cats = useCategories(bid);
  const txns = useTxnsInRange(bid, range.from, range.to);
  const data = txns.data ?? [];
  const names = Object.fromEntries((cats.data ?? []).map((c) => [c.id, c.name]));
  const totals = useMemo(() => summarize(data), [data]);
  const series = useMemo(() => monthlySeries(data, range.from, range.to), [data, range]);
  const breakdown = useMemo(() => categoryBreakdown(data, names), [data, names]);

  function exportCSV() {
    const rows = [...data]
      .sort((a, b) => a.transaction_date.localeCompare(b.transaction_date))
      .map((t) => ({
        Date: t.transaction_date,
        Type: t.type,
        Description: t.description,
        Category: names[t.category_id] ?? "",
        "Amount (INR)": Number(t.amount).toFixed(2),
        "Payment method": t.payment_method ? paymentLabel(t.payment_method) : "",
        Notes: t.notes ?? "",
      }));
    const csv = toCSV(rows, ["Date", "Type", "Description", "Category", "Amount (INR)", "Payment method", "Notes"]);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `vyaparlite_${range.from}_to_${range.to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="How the period went"
        subtitle="Built only from the entries saved in your ledger."
        actions={
          <>
            <DateRange from={range.from} to={range.to} onChange={setRange} />
            <Button variant="outline" onClick={exportCSV} disabled={!data.length}><Download /> Export CSV</Button>
          </>
        }
      />
      {txns.isLoading ? (
        <Skeleton className="h-96" />
      ) : txns.error ? (
        <p role="alert" className="text-sm text-destructive">Couldn't load report data. Please refresh.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-6 border-b border-rule pb-8 lg:grid-cols-3">
            <div className="col-span-2 lg:col-span-1"><Figure label="Net cash flow" value={totals.net} tone="ink" note="Income minus expenses, not profit" /></div>
            <Figure label="Money in" value={totals.income} tone="income" />
            <Figure label="Money out" value={totals.expense} tone="expense" />
          </div>
          <div className="grid gap-10 pt-8 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-10 lg:col-span-7">
              <Section title="Month by month" action={<ChartLegend />}>
                {data.length ? <IncomeExpenseChart data={series} /> : <Empty title="No entries in this period">Pick a wider date range above.</Empty>}
              </Section>
              {data.length > 0 && series.length > 1 && (
                <Section title="Net cash flow trend">
                  <NetTrendChart data={series} />
                </Section>
              )}
            </div>
            <Section title="Where the money went" className="lg:col-span-5">
              {breakdown.length === 0 ? (
                <Empty title="No expenses in this period" />
              ) : (
                <ol className="space-y-4">
                  {breakdown.map((b, i) => {
                    const pct = totals.expense ? (b.value / totals.expense) * 100 : 0;
                    return (
                      <li key={b.id}>
                        <div className="flex items-baseline gap-3 text-sm">
                          <span className="w-5 text-xs tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                          <span className="flex-1 truncate font-medium">{b.name}</span>
                          <span className="tabular-nums text-muted-foreground">{Math.round(pct)}%</span>
                          <span className="figure w-28 text-right text-base">{formatINR(b.value)}</span>
                        </div>
                        <div className="ml-8 mt-1.5 h-1.5 rounded-full bg-muted" aria-hidden>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Section>
          </div>
        </>
      )}
    </>
  );
}
