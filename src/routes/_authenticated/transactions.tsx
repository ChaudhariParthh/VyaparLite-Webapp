import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpDown, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { friendlyError, useBusiness, useCategories, useDeleteTxn, useTxnsInRange, type Txn } from "@/lib/data";
import { currentMonthRange, formatDate, formatINR, paymentLabel, summarize, toPaise } from "@/lib/finance";
import { DateRange, Empty, LedgerRow, PageHeader } from "@/components/app/widgets";
import { useEntry } from "@/components/app/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — VyaparLite" },
      { name: "description", content: "Search, filter and manage your income and expense records." },
      { property: "og:title", content: "Transactions — VyaparLite" },
      { property: "og:description", content: "Search, filter and manage your income and expense records." },
    ],
  }),
  component: Transactions,
});

const PAGE = 20;
type SortKey = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

function Transactions() {
  const { data: business } = useBusiness();
  const bid = business?.id;
  const cats = useCategories(bid);
  const [range, setRange] = useState(currentMonthRange());
  const txns = useTxnsInRange(bid, range.from, range.to);
  const del = useDeleteTxn();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [page, setPage] = useState(0);
  const entry = useEntry();
  const [toDelete, setToDelete] = useState<Txn | null>(null);

  const catName = Object.fromEntries((cats.data ?? []).map((c) => [c.id, c.name]));
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = (txns.data ?? []).filter(
      (t) => (type === "all" || t.type === type) && (cat === "all" || t.category_id === cat) && (!s || t.description.toLowerCase().includes(s)),
    );
    const [k, dir] = sort.split("_") as ["date" | "amount", "asc" | "desc"];
    const m = dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) =>
      k === "date" ? m * a.transaction_date.localeCompare(b.transaction_date) : m * (toPaise(a.amount) - toPaise(b.amount)),
    );
  }, [txns.data, q, type, cat, sort]);

  const sums = useMemo(() => summarize(filtered), [filtered]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const rows = filtered.slice(cur * PAGE, cur * PAGE + PAGE);
  const reset = () => setPage(0);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Transaction deleted");
    } catch (e) {
      toast.error(friendlyError(e));
    }
    setToDelete(null);
  }

  return (
    <>
      <PageHeader
        eyebrow="Ledger"
        title="Every rupee, in order"
        subtitle={<>{filtered.length} {filtered.length === 1 ? "entry" : "entries"} · <span className="text-income">+{formatINR(sums.income)}</span> · <span className="text-expense">−{formatINR(sums.expense)}</span></>}
        actions={<Button onClick={() => entry.add()} disabled={!entry.ready} className="hidden md:inline-flex"><Plus /> New entry</Button>}
      />
      <div>
        <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_auto_auto_auto_auto] lg:items-center">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden />
            <Input aria-label="Search by description" placeholder="Search descriptions…" className="h-10 bg-card pl-9" value={q} onChange={(e) => { setQ(e.target.value); reset(); }} />
          </div>
          <Select value={type} onValueChange={(v) => { setType(v); setCat("all"); reset(); }}>
            <SelectTrigger aria-label="Filter by type" className="h-10 bg-card lg:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entries</SelectItem>
              <SelectItem value="income">Money in</SelectItem>
              <SelectItem value="expense">Money out</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cat} onValueChange={(v) => { setCat(v); reset(); }}>
            <SelectTrigger aria-label="Filter by category" className="h-10 bg-card lg:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {(cats.data ?? []).filter((c) => type === "all" || c.type === type).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}{c.archived ? " (archived)" : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger aria-label="Sort" className="h-10 bg-card lg:w-44"><ArrowUpDown className="h-4 w-4" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest first</SelectItem>
              <SelectItem value="date_asc">Oldest first</SelectItem>
              <SelectItem value="amount_desc">Largest amount</SelectItem>
              <SelectItem value="amount_asc">Smallest amount</SelectItem>
            </SelectContent>
          </Select>
          <DateRange from={range.from} to={range.to} onChange={(r) => { setRange(r); reset(); }} />
        </div>

        {txns.isLoading ? (
          <Skeleton className="h-64" />
        ) : txns.error ? (
          <p role="alert" className="text-sm text-destructive">Couldn't load transactions. Please refresh.</p>
        ) : rows.length === 0 ? (
          <Empty title="Nothing matches" action={<Button variant="outline" size="sm" onClick={() => entry.add()} disabled={!entry.ready}><Plus /> New entry</Button>}>Try a wider date range or clear the filters.</Empty>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="text-left">
                  <tr className="border-b-2 border-foreground [&>th]:eyebrow [&>th]:text-foreground">
                    <th className="py-2 pl-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Description</th>
                    <th className="py-2 pr-3 font-medium">Category</th>
                    <th className="py-2 pr-3 font-medium">Type</th>
                    <th className="py-2 pr-3 font-medium">Method</th>
                    <th className="py-2 pr-3 text-right font-medium">Amount</th>
                    <th className="py-2 text-right font-medium"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} className="group border-b border-rule transition-colors hover:bg-card">
                      <td className="whitespace-nowrap py-3.5 pl-2 pr-3 tabular-nums text-muted-foreground">{formatDate(t.transaction_date)}</td>
                      <td className="max-w-[16rem] truncate py-3 pr-3 font-medium">{t.description}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{catName[t.category_id] ?? "—"}</td>
                      <td className="py-3 pr-3"><TypeMark t={t} /></td>
                      <td className="py-3 pr-3 text-muted-foreground">{paymentLabel(t.payment_method)}</td>
                      <td className={cn("figure whitespace-nowrap py-3 pr-3 text-right text-lg", t.type === "income" ? "text-income" : "text-expense")}>
                        {t.type === "income" ? "+" : "−"}{formatINR(Number(t.amount))}
                      </td>
                      <td className="whitespace-nowrap py-3 text-right opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"><RowActions t={t} onEdit={() => entry.edit(t)} onDelete={() => setToDelete(t)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden">
              {rows.map((t) => (
                <LedgerRow key={t.id} type={t.type} title={t.description} meta={`${catName[t.category_id] ?? "—"} · ${formatDate(t.transaction_date)}`} amount={Number(t.amount)}
                  trailing={<RowActions t={t} onEdit={() => entry.edit(t)} onDelete={() => setToDelete(t)} />} />
              ))}
            </div>
            {pages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Page {cur + 1} of {pages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>


      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-normal">Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.description}" for {toDelete ? formatINR(Number(toDelete.amount)) : ""} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} disabled={del.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {del.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TypeMark({ t }: { t: Txn }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", t.type === "income" ? "text-income" : "text-expense")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", t.type === "income" ? "bg-income" : "bg-expense")} aria-hidden />
      {t.type === "income" ? "In" : "Out"}
    </span>
  );
}

function RowActions({ t, onEdit, onDelete }: { t: Txn; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit ${t.description}`}><Pencil className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={onDelete} aria-label={`Delete ${t.description}`} className="text-expense hover:text-expense"><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
}
