import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Download, TrendingUp } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness, useCategories, useTxnsInRange } from "@/lib/data";
import { categoryBreakdown, currentMonthRange, formatINR, monthlySeries, paymentLabel, summarize, toCSV } from "@/lib/finance";
import { DateRange, Empty, IncomeExpenseChart, PageHeader, Panel, StatCard } from "@/components/app/widgets";

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

const COLORS = ["var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-1)", "var(--chart-5)", "var(--muted-foreground)"];

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
        title="Reports"
        subtitle="Based on your saved transactions for the selected period."
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
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total income" value={totals.income} tone="income" icon={<ArrowUp className="h-5 w-5" />} />
            <StatCard label="Total expenses" value={totals.expense} tone="expense" icon={<ArrowDown className="h-5 w-5" />} />
            <StatCard label="Net cash flow" value={totals.net} tone="info" icon={<TrendingUp className="h-5 w-5" />} hint="Income minus expenses (not profit)" />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <Panel title="Monthly income vs expenses" className="lg:col-span-3">
              {data.length ? <IncomeExpenseChart data={series} /> : <Empty title="No transactions in this period" />}
            </Panel>
            <Panel title="Expenses by category" className="lg:col-span-2">
              {breakdown.length === 0 ? (
                <Empty title="No expenses in this period" />
              ) : (
                <>
                  <div className="h-48">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                          {breakdown.map((b, i) => <Cell key={b.id} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatINR(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm">
                    {breakdown.map((b, i) => (
                      <li key={b.id} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} aria-hidden />
                        <span className="flex-1 truncate">{b.name}</span>
                        <span className="text-muted-foreground">{totals.expense ? Math.round((b.value / totals.expense) * 100) : 0}%</span>
                        <span className="w-28 text-right font-medium">{formatINR(b.value)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
