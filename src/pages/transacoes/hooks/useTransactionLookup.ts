import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TransactionClassification {
  categoria: string;
  tipo: string;
  tagDespesa: string;
  responsavel: string;
  incluirRateio: boolean;
}

/**
 * Fetches existing transactions and builds a lookup map by normalized description.
 * Used to auto-fill classification fields when user types a known description.
 */
export function useTransactionLookup() {
  const { user } = useAuth();
  const [lookupMap, setLookupMap] = useState<Map<string, TransactionClassification>>(new Map());

  useEffect(() => {
    if (!user?.id) return;

    const fetchClassifications = async () => {
      // Fetch most recent transactions ordered by date desc to get latest classification
      const { data, error } = await supabase
        .from("transactions")
        .select("description, category, type, tag, person, include_in_split, recurrence, date")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error || !data) return;

      const map = new Map<string, TransactionClassification>();

      for (const row of data) {
        const key = row.description.trim().toLowerCase();
        if (map.has(key)) continue; // keep only the most recent

        map.set(key, {
          categoria: row.category,
          tipo: row.recurrence === "monthly" ? "Recorrente" : "Pontual",
          tagDespesa: row.tag || "",
          responsavel: row.person,
          incluirRateio: row.include_in_split,
        });
      }

      setLookupMap(map);
    };

    fetchClassifications();
  }, [user?.id]);

  const lookup = useCallback(
    (description: string): TransactionClassification | null => {
      const key = description.trim().toLowerCase();
      if (!key) return null;
      return lookupMap.get(key) ?? null;
    },
    [lookupMap]
  );

  return { lookup };
}
