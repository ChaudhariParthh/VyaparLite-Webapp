import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { friendlyError, useBusiness, useCategories, useDeleteCategory, type Category } from "@/lib/data";
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from "@/lib/categories";
import type { TxnType } from "@/lib/finance";
import { PageHeader, Section as Panel } from "@/components/app/widgets";
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
      <PageHeader
        eyebrow="Categories"
        title="How you sort your money"
        subtitle="Rename, recolour, archive or delete a category. Deleting works only when no entries use it — archiving keeps past entries."
      />
      {cats.isLoading ? (
        <Skeleton className="h-80" />
      ) : (
        <div className="grid gap-12 lg:grid-cols-2">
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
  const [addColor, setAddColor] = useState<string>(DEFAULT_CATEGORY_COLOR[type]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<string>(DEFAULT_CATEGORY_COLOR[type]);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const del = useDeleteCategory();
  const done = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const add = useMutation({
    mutationFn: async (p: { name: string; color: string }) => {
      const { error } = await supabase.from("categories").insert({ business_id: businessId, type, ...p });
      if (error) throw error;
    },
    onSuccess: () => { setName(""); setAddColor(DEFAULT_CATEGORY_COLOR[type]); done(); toast.success("Category added"); },
    onError: (e) => toast.error(friendlyError(e)),
  });
  const update = useMutation({
    mutationFn: async (p: { id: string; name?: string; archived?: boolean; color?: string }) => {
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
    if (!n || n.length > 60) { toast.error("Name must be 1–60 characters."); return; }
    add.mutate({ name: n, color: addColor });
  }

  return (
    <Panel title={type === "income" ? "Money in" : "Money out"}>
      <form onSubmit={submitAdd} className="mb-4 space-y-2">
        <div className="flex gap-2">
          <Input className="bg-card" aria-label={`New ${type} category`} placeholder="New category name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          <Button type="submit" disabled={add.isPending}><Plus /> Add</Button>
        </div>
        <Swatches value={addColor} onChange={setAddColor} label={`Colour for the new ${type} category`} />
      </form>
      <ul>
        {items.map((c) => (
          <li key={c.id} className="flex min-h-12 items-center gap-2 border-b border-rule py-1.5">
            <span
              className="h-6 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: c.color ?? DEFAULT_CATEGORY_COLOR[c.type] }}
              aria-hidden
            />
            {editId === c.id ? (
              <form
                className="flex-1 space-y-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = editName.trim();
                  if (!n || n.length > 60) { toast.error("Name must be 1–60 characters."); return; }
                  update.mutate({ id: c.id, name: n, color: editColor });
                }}
              >
                <div className="flex gap-1">
                  <Input aria-label="Category name" value={editName} maxLength={60} onChange={(e) => setEditName(e.target.value)} autoFocus className="h-8" />
                  <Button size="icon" variant="ghost" type="submit" aria-label="Save" disabled={update.isPending}><Check className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" type="button" aria-label="Cancel" onClick={() => setEditId(null)}><X className="h-4 w-4" /></Button>
                </div>
                <Swatches value={editColor} onChange={setEditColor} label={`Colour for ${c.name}`} />
              </form>
            ) : (
              <>
                <span className={cn("flex-1 text-sm", c.archived && "text-muted-foreground line-through")}>{c.name}</span>
                {c.archived && <span className="text-xs text-muted-foreground">Archived</span>}
                <Button size="icon" variant="ghost" aria-label={`Rename ${c.name}`} onClick={() => { setEditId(c.id); setEditName(c.name); setEditColor(c.color ?? DEFAULT_CATEGORY_COLOR[c.type]); }}><Pencil className="h-4 w-4" /></Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={c.archived ? `Restore ${c.name}` : `Archive ${c.name}`}
                  onClick={() => update.mutate({ id: c.id, archived: !c.archived })}
                  disabled={update.isPending}
                >
                  {c.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${c.name}`}
                  className="text-expense hover:text-expense"
                  onClick={() => setToDelete(c)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="border-rule bg-paper">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-normal">Delete “{toDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Only a category with no entries can be deleted. If entries use it, archive it instead — past records stay intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!toDelete) return;
                del.mutate(toDelete, {
                  onSuccess: () => { toast.success("Category deleted"); setToDelete(null); },
                  onError: (err) => { toast.error(friendlyError(err)); setToDelete(null); },
                });
              }}
            >
              {del.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  );
}

function Swatches({ value, onChange, label }: { value: string; onChange: (c: string) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      {CATEGORY_COLORS.map((c, i) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={`Colour option ${i + 1}`}
          onClick={() => onChange(c)}
          className={cn(
            "h-6 w-6 shrink-0 rounded-full border-2 transition-transform",
            value === c ? "scale-110 border-foreground" : "border-transparent hover:scale-105",
          )}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}
