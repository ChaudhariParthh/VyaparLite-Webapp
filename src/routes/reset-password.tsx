import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthFrame } from "@/components/app/AuthFrame";
import { PasswordInput } from "@/components/app/PasswordInput";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — VyaparLite" },
      { name: "description", content: "Choose a new password for your VyaparLite account." },
      { property: "og:title", content: "Set a new password — VyaparLite" },
      { property: "og:description", content: "Choose a new password for your VyaparLite account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setReady(true);
    const { data } = supabase.auth.onAuthStateChange((ev) => ev === "PASSWORD_RECOVERY" && setReady(true));
    supabase.auth.getSession().then(({ data: s }) => s.session && setReady(true));
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw !== pw2) return setErr("Passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr(error.message);
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }

  return (
    <AuthFrame title="Set a new password">
      <form onSubmit={submit} className="space-y-5">
        {!ready ? (
          <p className="text-sm text-muted-foreground">Open this page from the reset link in your email.</p>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="np">New password</Label>
              <PasswordInput id="np" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np2">Confirm password</Label>
              <PasswordInput id="np2" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </div>
            {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Saving…" : "Update password"}</Button>
          </>
        )}
      </form>
    </AuthFrame>
  );
}
