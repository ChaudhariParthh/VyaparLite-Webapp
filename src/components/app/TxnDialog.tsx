import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAYMENT_METHODS, isValidAmount, todayIST, type TxnType } from "@/lib/finance";
import { friendlyError, useSaveTxn, type Category, type Txn } from "@/lib/data";
import { cn } from "@/lib/utils";

type Errs = { amount?: string; description?: string; category?: string; date?: string; notes?: string };

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  businessId: string;
  categories: Category[];
  initialType?: TxnType;
  editing?: Txn | null | undefined;
}

export function TxnDialog({ open, onOpenChange, businessId, categories, initialType = "income", editing }: Props) {
  const save = useSaveTxn(businessId);
  const [type, setType] = useState<TxnType>(initialType);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(todayIST());
  const [method, setMethod] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Errs>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setDescription(editing.description);
      setCategoryId(editing.category_id);
      setDate(editing.transaction_date);
      setMethod(editing.payment_method ?? "none");
      setNotes(editing.notes ?? "");
    } else {
      setType(initialType);
      setAmount("");
      setDescription("");
      setCategoryId("");
      setDate(todayIST());
      setMethod("none");
      setNotes("");
    }
  }, [open, editing, initialType]);

  const options = categories.filter((c) => c.type === type && (!c.archived || c.id === editing?.category_id));

  function switchType(t: TxnType) {
    setType(t);
    if (!categories.find((c) => c.id === categoryId && c.type === t)) setCategoryId("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Errs = {};
    if (!isValidAmount(amount)) er.amount = "Enter a positive amount with up to 2 decimals.";
    if (!description.trim()) er.description = "Description is required.";
    else if (description.trim().length > 200) er.description = "Keep it under 200 characters.";
    if (!options.find((c) => c.id === categoryId)) er.category = "Choose a category.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) er.date = "Choose a date.";
    if (notes.length > 1000) er.notes = "Notes must be under 1000 characters.";
    setErrors(er);
    if (Object.keys(er).length) return;
    try {
      await save.mutateAsync({
        id: editing?.id,
        input: {
          type,
          amount: amount.trim(),
          description: description.trim(),
          category_id: categoryId,
          transaction_date: date,
          payment_method: method === "none" ? null : method,
          notes: notes.trim() || null,
        },
      });
      toast.success(editing ? "Transaction updated" : "Transaction saved");
      onOpenChange(false);
    } catch (err) {
      toast.error(friendlyError(err));
    }
  }

  const tone = type === "income" ? "text-income" : "text-expense";
  return (
    <Dialog open={open} onOpenChange={(o) => !save.isPending && onOpenChange(o)}>
      <DialogContent className="max-h-[94dvh] gap-0 overflow-y-auto rounded-lg border-rule bg-paper p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-rule px-5 py-4 text-left">
          <DialogTitle className="font-display text-xl font-normal">{editing ? "Edit entry" : "New entry"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-6 px-5 pb-5 pt-5" noValidate>
          <div role="radiogroup" aria-label="Entry type" className="grid grid-cols-2 border border-input rounded-md p-1">
            {(["income", "expense"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={type === t}
                onClick={() => switchType(t)}
                className={cn(
                  "h-10 rounded-sm text-sm font-semibold transition-colors",
                  type === t ? (t === "income" ? "bg-income text-primary-foreground" : "bg-expense text-destructive-foreground") : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t === "income" ? "Money in" : "Money out"}
              </button>
            ))}
          </div>

          <div>
            <Label htmlFor="amt" className="eyebrow">Amount</Label>
            <div className={cn("mt-1 flex items-baseline gap-1 border-b-2 pb-1 transition-colors focus-within:border-leaf", errors.amount ? "border-destructive" : "border-input")}>
              <span className={cn("figure text-4xl", tone)} aria-hidden>₹</span>
              <input
                id="amt"
                inputMode="decimal"
                autoComplete="off"
                autoFocus={!editing}
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? "amt-err" : undefined}
                className={cn("figure w-full min-w-0 bg-transparent text-5xl outline-none placeholder:text-muted-foreground/40", tone)}
              />
            </div>
            {errors.amount && <p id="amt-err" role="alert" className="mt-1 text-xs text-destructive">{errors.amount}</p>}
          </div>

          <Field id="desc" label="What was it for?" error={errors.description}>
            <Input id="desc" className="h-11 bg-card" placeholder={type === "income" ? "e.g. Counter sales, Rahul Traders" : "e.g. Electricity bill — March"} value={description} maxLength={200} onChange={(e) => setDescription(e.target.value)} aria-invalid={!!errors.description} />
          </Field>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Category</legend>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Category">
              {options.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={categoryId === c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    "min-h-9 rounded-full border px-3 text-sm transition-colors",
                    categoryId === c.id ? "border-ink bg-ink text-ink-foreground" : "border-input bg-card hover:border-foreground/40",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
            {errors.category && <p role="alert" className="mt-1 text-xs text-destructive">{errors.category}</p>}
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="date" label="Date" error={errors.date}>
              <Input id="date" type="date" className="h-11 bg-card" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field id="pm" label="Paid via (optional)">
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id="pm" className="h-11 bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  {PAYMENT_METHODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field id="notes" label="Notes (optional)" error={errors.notes}>
            <Textarea id="notes" rows={2} className="bg-card" maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div className="sticky bottom-0 -mx-5 -mb-5 border-t border-rule bg-paper px-5 py-4">
            <Button type="submit" size="lg" variant={type} className="w-full" disabled={save.isPending}>
              {save.isPending ? "Saving…" : editing ? "Save changes" : type === "income" ? "Record money in" : "Record money out"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
