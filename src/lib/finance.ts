export type TxnType = "income" | "expense";

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
] as const;

export const paymentLabel = (v?: string | null) =>
  PAYMENT_METHODS.find((p) => p.value === v)?.label ?? "—";

/** Convert a rupee amount (number or numeric string) to integer paise to avoid float drift. */
export const toPaise = (v: number | string) => Math.round(Number(v) * 100);
export const fromPaise = (p: number) => p / 100;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});
export const formatINR = (rupees: number) => inr.format(rupees);

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
/** Format a YYYY-MM-DD date string (calendar date, no time zone shifting). */
export const formatDate = (iso: string) => dateFmt.format(new Date(iso + "T00:00:00Z"));

/** Today's calendar date in Asia/Kolkata as YYYY-MM-DD. */
export function todayIST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function currentMonthRange(now: Date = new Date()): { from: string; to: string } {
  const t = todayIST(now);
  const [y, m] = t.split("-").map(Number) as [number, number];
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(last).padStart(2, "0")}` };
}

export const AMOUNT_RE = /^\d{1,10}(\.\d{1,2})?$/;
export function isValidAmount(s: string): boolean {
  return AMOUNT_RE.test(s.trim()) && Number(s) > 0;
}

export interface TxnLike {
  type: TxnType;
  amount: number | string;
  transaction_date: string;
  category_id?: string;
}

export function summarize(txns: TxnLike[]) {
  let inc = 0;
  let exp = 0;
  for (const t of txns) {
    if (t.type === "income") inc += toPaise(t.amount);
    else exp += toPaise(t.amount);
  }
  return { income: fromPaise(inc), expense: fromPaise(exp), net: fromPaise(inc - exp) };
}

/** Group by YYYY-MM between from..to inclusive, filling empty months. */
export function monthlySeries(txns: TxnLike[], from: string, to: string) {
  const months: string[] = [];
  let [y, m] = from.slice(0, 7).split("-").map(Number) as [number, number];
  const [ey, em] = to.slice(0, 7).split("-").map(Number) as [number, number];
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  const map = new Map(months.map((k) => [k, { inc: 0, exp: 0 }]));
  for (const t of txns) {
    const b = map.get(t.transaction_date.slice(0, 7));
    if (!b) continue;
    if (t.type === "income") b.inc += toPaise(t.amount);
    else b.exp += toPaise(t.amount);
  }
  const lbl = new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" });
  return months.map((k) => {
    const b = map.get(k)!;
    return {
      month: lbl.format(new Date(k + "-01T00:00:00Z")),
      income: fromPaise(b.inc),
      expense: fromPaise(b.exp),
    };
  });
}

export function categoryBreakdown(
  txns: TxnLike[],
  names: Record<string, string>,
  type: TxnType = "expense",
) {
  const map = new Map<string, number>();
  for (const t of txns) {
    if (t.type !== type || !t.category_id) continue;
    map.set(t.category_id, (map.get(t.category_id) ?? 0) + toPaise(t.amount));
  }
  return [...map.entries()]
    .map(([id, p]) => ({ id, name: names[id] ?? "Unknown", value: fromPaise(p) }))
    .sort((a, b) => b.value - a.value);
}

const csvCell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s; // guard against spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};
export function toCSV(rows: Record<string, unknown>[], headers: string[]): string {
  return [headers.map(csvCell).join(","), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(","))].join(
    "\n",
  );
}
