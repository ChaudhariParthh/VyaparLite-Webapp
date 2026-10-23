import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TxnType } from "./finance";

export interface Business {
  id: string;
  name: string;
  business_type: string;
  currency: string;
  timezone: string;
}
export interface Category {
  id: string;
  name: string;
  type: TxnType;
  archived: boolean;
  color: string | null;
}
export interface Txn {
  id: string;
  type: TxnType;
  amount: number;
  description: string;
  category_id: string;
  transaction_date: string;
  payment_method: string | null;
  notes: string | null;
}

export function useBusiness() {
  return useQuery({
    queryKey: ["business"],
    queryFn: async (): Promise<Business | null> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,business_type,currency,timezone")
        .eq("owner_id", u.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCategories(businessId?: string) {
  return useQuery({
    queryKey: ["categories", businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,type,archived,color")
        .eq("business_id", businessId!)
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });
}

/** All transactions in a date range (used for totals, charts and reports). */
export function useTxnsInRange(businessId: string | undefined, from: string, to: string) {
  return useQuery({
    queryKey: ["txns", businessId, from, to],
    enabled: !!businessId,
    queryFn: async (): Promise<Txn[]> => {
      const all: Txn[] = [];
      const page = 1000;
      for (let off = 0; ; off += page) {
        const { data, error } = await supabase
          .from("transactions")
          .select("id,type,amount,description,category_id,transaction_date,payment_method,notes")
          .eq("business_id", businessId!)
          .gte("transaction_date", from)
          .lte("transaction_date", to)
          .order("transaction_date", { ascending: false })
          .order("created_at", { ascending: false })
          .range(off, off + page - 1);
        if (error) throw error;
        all.push(...(data as Txn[]));
        if (data.length < page) break;
      }
      return all;
    },
  });
}

export interface TxnInput {
  type: TxnType;
  amount: string;
  description: string;
  category_id: string;
  transaction_date: string;
  payment_method: string | null;
  notes: string | null;
}

export function useSaveTxn(businessId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string | undefined; input: TxnInput }) => {
      const row = { ...input, amount: Number(input.amount) };
      if (id) {
        const { error } = await supabase.from("transactions").update(row).eq("id", id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("transactions")
          .insert({ ...row, business_id: businessId!, created_by: u.user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["txns"] }),
  });
}

export function useDeleteTxn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["txns"] }),
  });
}

/** Categories with entries cannot be deleted — the ledger must stay complete. */
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Category) => {
      const { count, error } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("category_id", c.id);
      if (error) throw error;
      const blocked = categoryInUseError(count ?? 0);
      if (blocked) throw new Error(blocked);
      const { error: delError } = await supabase.from("categories").delete().eq("id", c.id);
      if (delError) throw delError;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function friendlyError(e: unknown): string {
  const msg = (e as { message?: string; code?: string })?.message ?? "";
  const code = (e as { code?: string })?.code;
  if (code === "23505") return "That name already exists.";
  if (code === "23503") return "The selected category isn't valid for this type.";
  if (code === "42501") return "You don't have permission to do that.";
  return msg || "Something went wrong. Please try again.";
}
