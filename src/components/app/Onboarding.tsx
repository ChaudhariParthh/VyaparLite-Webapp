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
import { AuthFrame } from "./AuthFrame";

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
  const [type, setType] = useState<string>(BUSINESS_TYPES[0]!);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = schema.safeParse({ name });
    if (!p.success) return setErr(p.error.issues[0]?.message ?? "Invalid");
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
    <AuthFrame title="Tell us about your business" lead="We'll set up common income and expense categories so you can start recording right away.">
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="bname">Business name</Label>
          <Input className="h-11 bg-card" id="bname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sharma General Store" maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="btype">Business type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="btype" className="h-11 bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Creating…" : "Continue to dashboard"}</Button>
      </form>
    </AuthFrame>
  );
}
