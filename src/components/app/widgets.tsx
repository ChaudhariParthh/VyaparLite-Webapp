import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/finance";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-4 shadow-card sm:p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function DateRange({ from, to, onChange }: { from: string; to: string; onChange: (r: { from: string; to: string }) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-2 py-1 shadow-card">
      <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <Input
        type="date"
        aria-label="From date"
        value={from}
        max={to}
        onChange={(e) => e.target.value && onChange({ from: e.target.value, to })}
        className="h-8 w-[8.5rem] border-0 px-1 shadow-none focus-visible:ring-1"
      />
      <span className="text-muted-foreground">–</span>
      <Input
        type="date"
        aria-label="To date"
        value={to}
        min={from}
        onChange={(e) => e.target.value && onChange({ from, to: e.target.value })}
        className="h-8 w-[8.5rem] border-0 px-1 shadow-none focus-visible:ring-1"
      />
    </div>
  );
}

const tones = {
  income: "bg-income-soft text-income",
  expense: "bg-expense-soft text-expense",
  info: "bg-info-soft text-info",
};

export function StatCard({ label, value, icon, tone, hint }: { label: string; value: number; icon: ReactNode; tone: keyof typeof tones; hint?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-card sm:p-5">
      <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full", tones[tone])}>{icon}</span>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn("truncate text-xl font-bold sm:text-2xl", tone === "info" && value < 0 && "text-expense")}>{formatINR(value)}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

export function IncomeExpenseChart({ data }: { data: { month: string; income: number; expense: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -10, right: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
          <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" tickFormatter={(v) => "₹" + compact.format(v)} />
          <Tooltip formatter={(v: number) => formatINR(v)} cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" name="Income" fill="var(--income)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" name="Expenses" fill="var(--expense)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-10 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
