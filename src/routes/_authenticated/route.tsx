import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { Onboarding } from "@/components/app/Onboarding";
import { useBusiness } from "@/lib/data";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { redirect: location.pathname } });
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { data: business, isLoading, error } = useBusiness();
  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  if (error)
    return <div className="p-8 text-center text-destructive">Couldn't load your business. Please refresh.</div>;
  if (!business) return <Onboarding />;
  return (
    <AppShell business={business}>
      <Outlet />
    </AppShell>
  );
}
