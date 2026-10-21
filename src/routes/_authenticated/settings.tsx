import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { friendlyError, useBusiness } from "@/lib/data";
import { BUSINESS_TYPES } from "@/components/app/Onboarding";
import { PageHeader, Section as Panel } from "@/components/app/widgets";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — VyaparLite" },
      { name: "description", content: "Edit your business profile and account." },
      { property: "og:title", content: "Settings — VyaparLite" },
      { property: "og:description", content: "Edit your business profile and account." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: b } = useBusiness();
  const user = useQuery({ queryKey: ["me"], queryFn: async () => (await supabase.auth.getUser()).data.user });
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  useEffect(() => {
    if (b) { setName(b.name); setType(b.business_type); }
  }, [b]);

  const save = useMutation({
    mutationFn: async () => {
      const n = name.trim();
      if (!n || n.length > 120) throw new Error("Business name must be 1–120 characters.");
      const { error } = await supabase.from("businesses").update({ name: n, business_type: type }).eq("id", b!.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["business"] }); toast.success("Changes saved"); },
    onError: (e) => toast.error(friendlyError(e)),
  });

  const types = BUSINESS_TYPES.includes(type) || !type ? BUSINESS_TYPES : [type, ...BUSINESS_TYPES];

  return (
    <>
      <PageHeader eyebrow="Settings" title="Your business" />
      <div className="grid max-w-2xl gap-12">
        <Panel title="Business profile">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
            <div className="space-y-1.5">
              <Label htmlFor="bn">Business name</Label>
              <Input className="bg-card" id="bn" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bt">Business type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="bt" className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cur">Currency</Label>
                <Input id="cur" value="INR (₹)" disabled />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tz">Time zone</Label>
                <Input id="tz" value="Asia/Kolkata (IST)" disabled />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">VyaparLite currently supports INR and Indian Standard Time only.</p>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save changes"}</Button>
          </form>
        </Panel>
        <Panel title="Categories">
          <p className="mb-3 text-sm text-muted-foreground">Rename, add or archive the categories you sort entries into.</p>
          <Button asChild variant="outline"><Link to="/categories">Manage categories</Link></Button>
        </Panel>
        <Panel title="Account">
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="mb-4 font-medium">{user.data?.email}</p>
          <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}>
            <LogOut /> Sign out
          </Button>
        </Panel>
      </div>
    </>
  );
}
