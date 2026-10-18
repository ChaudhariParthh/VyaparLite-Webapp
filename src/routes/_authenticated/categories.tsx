import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Check, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { friendlyError, useBusiness, useCategories, type Category } from "@/lib/data";
import type { TxnType } from "@/lib/finance";
import { PageHeader, Panel } from "@/components/app/widgets";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/categories")({
  head: () => ({
    meta: [
      { title: "Categories — VyaparLite" },
      { name: "description", content: "Manage your income and expense categories." },
      { property: "og:title", content: "Categories — VyaparLite" },
      { property: "og:description", content: "Manage your income and expense categories." },
    ],
  }),
  component: Categories,
});

function Categories() {
  const { data: business } = useBusiness();
  const cats = useCategories(business?.id);
  return (
    <>
      <PageHeader title="Categories" subtitle="Archived categories stay on past transactions but can't be picked for new ones." />
      {cats.isLoading ? (
        <Skeleton className="h-80" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {(["income", "expense"] as const).map((t) => (
            <CategoryList key={t} type={t} businessId={business!.id} items={(cats.data ?? []).filter((c) => c.type === t)} />
          ))}
        </div>
      )}
    </>
  );
}

function CategoryList({ type, businessId, items }: { type: TxnType; businessId: string; items: Category[] }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const done = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const add = useMutation({
    mutationFn: async (n: string) => {
      const { error } = await supabase.from("categories").insert({ business_id: businessId, name: n, type });
      if (error) throw error;
    },
    onSuccess: () => { setName(""); done(); toast.success("Category added"); },
    onError: (e) => toast.error(friendlyError(e)),
  });
  const update = useMutation({
    mutationFn: async (p: { id: string; name?: string; archived?: boolean }) => {
      const { id, ...rest } = p;
      const { error } = await supabase.from("categories").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { setEditId(null); done(); },
    onError: (e) => toast.error(friendlyError(e)),
  });

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n || n.length > 60) return toast.error("Name must be 1–60 characters.");
    add.mutate(n);
  }

  return (
    <Panel title={type === "income" ? "Income categories" : "Expense categories"}>
      <form onSubmit={submitAdd} className="mb-4 flex gap-2">
        <Input aria-label={`New ${type} category`} placeholder="New category name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" disabled={add.isPending}><Plus /> Add</Button>
      </form>
      <ul className="divide-y">
        {items.map((c) => (
          <li key={c.id} className="flex items-center gap-2 py-2.5">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", type === "income" ? "bg-income" : "bg-expense")} aria-hidden />
            {editId === c.id ? (
              <form
                className="flex flex-1 gap-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = editName.trim();
                  if (!n || n.length > 60) return toast.error("Name must be 1–60 characters.");
                  update.mutate({ id: c.id, name: n });
                }}
              >
                <Input aria-label="Category name" value={editName} maxLength={60} onChange={(e) => setEditName(e.target.value)} autoFocus className="h-8" />
                <Button size="icon" variant="ghost" type="submit" aria-label="Save" disabled={update.isPending}><Check className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" type="button" aria-label="Cancel" onClick={() => setEditId(null)}><X className="h-4 w-4" /></Button>
              </form>
            ) : (
              <>
                <span className={cn("flex-1 text-sm", c.archived && "text-muted-foreground line-through")}>{c.name}</span>
                {c.archived && <span className="text-xs text-muted-foreground">Archived</span>}
                <Button size="icon" variant="ghost" aria-label={`Rename ${c.name}`} onClick={() => { setEditId(c.id); setEditName(c.name); }}><Pencil className="h-4 w-4" /></Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={c.archived ? `Restore ${c.name}` : `Archive ${c.name}`}
                  onClick={() => update.mutate({ id: c.id, archived: !c.archived })}
                  disabled={update.isPending}
                >
                  {c.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
