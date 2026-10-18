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

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  businessId: string;
  categories: Category[];
  initialType?: TxnType;
  editing?: Txn | null;
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
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    const er: Record<string, string> = {};
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

  return (
    <Dialog open={open} onOpenChange={(o) => !save.isPending && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit transaction" : "Add transaction"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div role="radiogroup" aria-label="Type" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["income", "expense"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={type === t}
                onClick={() => switchType(t)}
                className={cn(
                  "rounded-md py-2 text-sm font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  type === t ? (t === "income" ? "bg-income text-primary-foreground" : "bg-expense text-destructive-foreground") : "text-muted-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <Field id="amt" label="Amount (₹)" error={errors.amount}>
            <Input id="amt" inputMode="decimal" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!!errors.amount} />
          </Field>
          <Field id="desc" label="Description" error={errors.description}>
            <Input id="desc" placeholder={type === "income" ? "e.g. Sale of goods" : "e.g. Electricity bill"} value={description} maxLength={200} onChange={(e) => setDescription(e.target.value)} aria-invalid={!!errors.description} />
          </Field>
          <Field id="cat" label="Category" error={errors.category}>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="cat" aria-invalid={!!errors.category}><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {options.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="date" label="Date" error={errors.date}>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field id="pm" label="Payment method (optional)">
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id="pm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  {PAYMENT_METHODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field id="notes" label="Notes (optional)" error={errors.notes}>
            <Textarea id="notes" rows={2} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
