import type { ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR } from "@/lib/finance";
import { cn } from "@/lib/utils";

/** Page masthead: small eyebrow, serif title, optional controls on the right. */
export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="rise mb-8 flex flex-col gap-4 border-b border-rule pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-normal leading-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Ruled section — a title line and content, no box. */
export function Section({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-baseline justify-between gap-2 border-b border-rule pb-2">
          {title && <h2 className="eyebrow text-foreground">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export const Panel = Section;

/** Segmented date range: native date inputs styled as one control. */
export function DateRange({ from, to, onChange }: { from: string; to: string; onChange: (r: { from: string; to: string }) => void }) {
  const cls = "h-9 min-w-0 flex-1 bg-transparent px-2 text-sm tabular-nums focus-visible:outline-none focus-visible:bg-secondary rounded-sm";
  return (
    <div className="flex w-full items-center rounded-md border border-input bg-card sm:w-auto">
      <label className="sr-only" htmlFor="dr-from">From date</label>
      <input id="dr-from" type="date" value={from} max={to} onChange={(e) => e.target.value && onChange({ from: e.target.value, to })} className={cls} />
      <span className="px-1 text-muted-foreground" aria-hidden>→</span>
      <label className="sr-only" htmlFor="dr-to">To date</label>
      <input id="dr-to" type="date" value={to} min={from} onChange={(e) => e.target.value && onChange({ from, to: e.target.value })} className={cls} />
    </div>
  );
}

/** Inline figure — used for income / expense / net, sized by importance. */
export function Figure({ label, value, tone, size = "md", note }: { label: string; value: number; tone?: "income" | "expense" | "ink"; size?: "xl" | "md"; note?: string }) {
  return (
    <div className="min-w-0">
      <p className="eyebrow flex items-center gap-2">
        {tone && tone !== "ink" && <span className={cn("h-2 w-2 rounded-full", tone === "income" ? "bg-income" : "bg-expense")} aria-hidden />}
        {label}
      </p>
      <p
        className={cn(
          "figure mt-1 truncate",
          size === "xl" ? "text-5xl sm:text-7xl" : "text-2xl sm:text-3xl",
          tone === "income" && "text-income",
          tone === "expense" && "text-expense",
          tone === "ink" && value < 0 && "text-expense",
        )}
      >
        {formatINR(value)}
      </p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

/** Horizontal proportion bar showing how income splits into expenses and what remains. */
export function FlowBar({ income, expense }: { income: number; expense: number }) {
  const total = Math.max(income, expense);
  if (total <= 0) return <div className="h-2 rounded-full bg-muted" aria-hidden />;
  const exp = Math.min(100, (expense / total) * 100);
  const inc = Math.min(100, (income / total) * 100);
  return (
    <div className="space-y-1.5" aria-hidden>
      <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-income transition-[width] duration-700" style={{ width: `${inc}%` }} /></div>
      <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-expense transition-[width] duration-700" style={{ width: `${exp}%` }} /></div>
    </div>
  );
}

const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const tipStyle = { borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12, boxShadow: "var(--shadow-lift)" };

export function ChartLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-income" />Income</span>
      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-expense" />Expenses</span>
    </div>
  );
}

export function IncomeExpenseChart({ data, height = 260 }: { data: { month: string; income: number; expense: number }[]; height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -12, right: 0, top: 8 }} barGap={3}>
          <CartesianGrid vertical={false} stroke="var(--rule)" strokeDasharray="2 4" />
          <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "var(--rule)" }} fontSize={11} stroke="var(--muted-foreground)" />
          <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" tickFormatter={(v) => "₹" + compact.format(v)} width={56} />
          <Tooltip formatter={(v: number) => formatINR(v)} cursor={{ fill: "var(--muted)" }} contentStyle={tipStyle} />
          <Bar dataKey="income" name="Income" fill="var(--income)" radius={[2, 2, 0, 0]} maxBarSize={18} />
          <Bar dataKey="expense" name="Expenses" fill="var(--expense)" radius={[2, 2, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function NetTrendChart({ data, height = 200 }: { data: { month: string; income: number; expense: number }[]; height?: number }) {
  const rows = data.map((d) => ({ month: d.month, net: Math.round((d.income - d.expense) * 100) / 100 }));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <AreaChart data={rows} margin={{ left: -12, right: 0, top: 8 }}>
          <defs>
            <linearGradient id="netfill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--leaf)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--leaf)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--rule)" strokeDasharray="2 4" />
          <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "var(--rule)" }} fontSize={11} stroke="var(--muted-foreground)" />
          <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" tickFormatter={(v) => "₹" + compact.format(v)} width={56} />
          <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={tipStyle} />
          <Area type="monotone" dataKey="net" name="Net cash flow" stroke="var(--ink)" strokeWidth={1.75} fill="url(#netfill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1 border-l-2 border-leaf py-3 pl-4">
      <p className="font-display text-lg">{title}</p>
      {children && <div className="text-sm text-muted-foreground">{children}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** One ledger line: description + meta on the left, signed amount on the right. */
export function LedgerRow({ type, title, meta, amount, trailing }: { type: "income" | "expense"; title: string; meta: ReactNode; amount: number; trailing?: ReactNode }) {
  return (
    <div className="group flex items-center gap-3 border-b border-rule py-3 last:border-0">
      <span className={cn("h-8 w-1 shrink-0 rounded-full", type === "income" ? "bg-income" : "bg-expense")} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <p className={cn("figure shrink-0 text-lg", type === "income" ? "text-income" : "text-expense")}>
        <span className="sr-only">{type === "income" ? "Income" : "Expense"} </span>
        {type === "income" ? "+" : "−"}{formatINR(amount)}
      </p>
      {trailing}
    </div>
  );
}
