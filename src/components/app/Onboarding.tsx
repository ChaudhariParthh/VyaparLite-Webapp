import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { friendlyError } from "@/lib/data";
import { Logo } from "./Logo";

export const BUSINESS_TYPES = [
  "Retail Shop",
  "Grocery / Kirana",
  "Restaurant / Food",
  "Services",
  "Wholesale",
  "Manufacturing",
  "Freelancer",
  "Other",
];

const schema = z.object({ name: z.string().trim().min(1, "Enter your business name").max(120) });

export function Onboarding() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState(BUSINESS_TYPES[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = schema.safeParse({ name });
    if (!p.success) return setErr(p.error.issues[0].message);
    setBusy(true);
    setErr(null);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("businesses")
      .insert({ owner_id: u.user!.id, name: p.data.name, business_type: type });
    setBusy(false);
    if (error) return setErr(friendlyError(error));
    toast.success("Business created");
    qc.invalidateQueries({ queryKey: ["business"] });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl border bg-card p-6 shadow-card sm:p-8">
        <Logo />
        <div>
          <h1 className="text-2xl font-bold">Set up your business</h1>
          <p className="mt-1 text-sm text-muted-foreground">We'll add common income and expense categories for you.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bname">Business name</Label>
          <Input id="bname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sharma General Store" maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="btype">Business type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="btype"><SelectValue /></SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Continue to dashboard"}</Button>
      </form>
    </main>
  );
}
