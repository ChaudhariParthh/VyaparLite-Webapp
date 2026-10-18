import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpDown, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { friendlyError, useBusiness, useCategories, useDeleteTxn, useTxnsInRange, type Txn } from "@/lib/data";
import { currentMonthRange, formatDate, formatINR, paymentLabel, toPaise } from "@/lib/finance";
import { DateRange, Empty, PageHeader, Panel } from "@/components/app/widgets";
import { TxnDialog } from "@/components/app/TxnDialog";
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
  const [editing, setEditing] = useState<Txn | null>(null);
  const [open, setOpen] = useState(false);
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
        title="Transactions"
        subtitle={`${filtered.length} record${filtered.length === 1 ? "" : "s"}`}
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }} disabled={!cats.data}><Plus /> Add transaction</Button>}
      />
      <Panel>
        <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
          <div className="relative lg:w-56">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
            <Input aria-label="Search by description" placeholder="Search transactions…" className="pl-8" value={q} onChange={(e) => { setQ(e.target.value); reset(); }} />
          </div>
          <Select value={type} onValueChange={(v) => { setType(v); setCat("all"); reset(); }}>
            <SelectTrigger aria-label="Filter by type" className="lg:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cat} onValueChange={(v) => { setCat(v); reset(); }}>
            <SelectTrigger aria-label="Filter by category" className="lg:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {(cats.data ?? []).filter((c) => type === "all" || c.type === type).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}{c.archived ? " (archived)" : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger aria-label="Sort" className="lg:w-44"><ArrowUpDown className="h-4 w-4" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest first</SelectItem>
              <SelectItem value="date_asc">Oldest first</SelectItem>
              <SelectItem value="amount_desc">Amount: high to low</SelectItem>
              <SelectItem value="amount_asc">Amount: low to high</SelectItem>
            </SelectContent>
          </Select>
          <div className="sm:col-span-2 lg:ml-auto"><DateRange from={range.from} to={range.to} onChange={(r) => { setRange(r); reset(); }} /></div>
        </div>

        {txns.isLoading ? (
          <Skeleton className="h-64" />
        ) : txns.error ? (
          <p role="alert" className="text-sm text-destructive">Couldn't load transactions. Please refresh.</p>
        ) : rows.length === 0 ? (
          <Empty title="No transactions found">Try a different date range or filter, or add a new transaction.</Empty>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3 font-medium">Date</th>
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
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="whitespace-nowrap py-3 pr-3">{formatDate(t.transaction_date)}</td>
                      <td className="max-w-[16rem] truncate py-3 pr-3 font-medium">{t.description}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{catName[t.category_id] ?? "—"}</td>
                      <td className="py-3 pr-3"><TypeBadge t={t} /></td>
                      <td className="py-3 pr-3 text-muted-foreground">{paymentLabel(t.payment_method)}</td>
                      <td className={cn("whitespace-nowrap py-3 pr-3 text-right font-semibold", t.type === "income" ? "text-income" : "text-expense")}>
                        {t.type === "income" ? "+" : "−"}{formatINR(Number(t.amount))}
                      </td>
                      <td className="whitespace-nowrap py-3 text-right"><RowActions t={t} onEdit={() => { setEditing(t); setOpen(true); }} onDelete={() => setToDelete(t)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y md:hidden">
              {rows.map((t) => (
                <li key={t.id} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.transaction_date)} · {catName[t.category_id] ?? "—"}</p>
                    <p className={cn("mt-1 font-semibold", t.type === "income" ? "text-income" : "text-expense")}>
                      {t.type === "income" ? "+" : "−"}{formatINR(Number(t.amount))}
                    </p>
                  </div>
                  <RowActions t={t} onEdit={() => { setEditing(t); setOpen(true); }} onDelete={() => setToDelete(t)} />
                </li>
              ))}
            </ul>
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
      </Panel>

      {bid && cats.data && <TxnDialog open={open} onOpenChange={setOpen} businessId={bid} categories={cats.data} editing={editing} />}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
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

function TypeBadge({ t }: { t: Txn }) {
  return (
    <Badge variant="secondary" className={cn("capitalize", t.type === "income" ? "bg-income-soft text-income" : "bg-expense-soft text-expense")}>
      {t.type}
    </Badge>
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
