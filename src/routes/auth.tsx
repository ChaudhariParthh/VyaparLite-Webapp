import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app/Logo";

type Mode = "signin" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => {
    const r = s["redirect"];
    return typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? { redirect: r } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — VyaparLite" },
      { name: "description", content: "Sign in or create your VyaparLite account." },
      { property: "og:title", content: "Sign in — VyaparLite" },
      { property: "og:description", content: "Sign in or create your VyaparLite account." },
    ],
  }),
  component: AuthPage,
});

const emailS = z.string().trim().email("Enter a valid email").max(255);
const passS = z.string().min(8, "Password must be at least 8 characters").max(72);

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const dest = redirect ?? "/dashboard";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && navigate({ to: dest }));
  }, [dest, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    const em = emailS.safeParse(email);
    if (!em.success) return setErr(em.error.issues[0].message);
    if (mode !== "forgot") {
      const pw = passS.safeParse(password);
      if (!pw.success) return setErr(pw.error.issues[0].message);
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: em.data, password });
        if (error) throw error;
        navigate({ to: dest });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: em.data,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name.trim().slice(0, 100) } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/dashboard" });
        else setInfo("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(em.data, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        setInfo("If an account exists for that email, a reset link is on its way.");
      }
    } catch (e) {
      const m = (e as Error).message;
      setErr(m.includes("Invalid login") ? "Incorrect email or password." : m.includes("not confirmed") ? "Please confirm your email first." : m);
    } finally {
      setBusy(false);
    }
  }

  const titles = { signin: "Welcome back", signup: "Create your account", forgot: "Reset your password" };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border bg-card p-6 shadow-card sm:p-8">
        <Logo />
        <div>
          <h1 className="text-2xl font-bold">{titles[mode]}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Simple income & expense tracking for your business.</p>
        </div>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name (optional)</Label>
              <Input id="name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pw">Password</Label>
                {mode === "signin" && (
                  <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => { setMode("forgot"); setErr(null); }}>
                    Forgot password?
                  </button>
                )}
              </div>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            </div>
          )}
          {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
          {info && <p role="status" className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">{info}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New to VyaparLite? " : "Already have an account? "}
          <button type="button" className="font-medium text-primary hover:underline" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(null); setInfo(null); }}>
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
}

