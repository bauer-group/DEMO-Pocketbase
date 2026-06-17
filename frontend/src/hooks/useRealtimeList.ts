import { useEffect, useState } from "react";
import type { RecordModel } from "pocketbase";
import { pb } from "@/lib/pb";
import { getErrorMessage } from "@/lib/errors";

// ----------------------------------------------------------------------------
// Generischer Hook: lädt eine gefilterte Collection-Liste und hält sie per
// Realtime-Subscription live. PocketBase filtert & expandiert die Realtime-
// Events serverseitig (Optionen filter/expand) – wir mergen sie nur lokal ein.
// ----------------------------------------------------------------------------

export interface RealtimeListOptions {
  enabled?: boolean;
  filter?: string;
  sort?: string; // z. B. "-created" (desc) oder "created" (asc)
  expand?: string;
}

function sortItems<T extends RecordModel>(arr: T[], sort?: string): T[] {
  if (!sort) return arr;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return [...arr].sort((a, b) => {
    const av = (a as Record<string, unknown>)[field] as string | number;
    const bv = (b as Record<string, unknown>)[field] as string | number;
    if (av === bv) return 0;
    return (av < bv ? -1 : 1) * (desc ? -1 : 1);
  });
}

export function useRealtimeList<T extends RecordModel>(
  collection: string,
  { enabled = true, filter, sort = "-created", expand }: RealtimeListOptions
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await pb
          .collection(collection)
          .getFullList<T>({ filter, sort, expand });
        if (cancelled) return;
        setItems(list);

        const unsub = await pb.collection(collection).subscribe<T>(
          "*",
          (e) => {
            setItems((prev) => {
              switch (e.action) {
                case "create":
                  if (prev.some((r) => r.id === e.record.id)) return prev;
                  return sortItems([e.record, ...prev], sort);
                case "update":
                  return sortItems(
                    prev.map((r) => (r.id === e.record.id ? e.record : r)),
                    sort
                  );
                case "delete":
                  return prev.filter((r) => r.id !== e.record.id);
                default:
                  return prev;
              }
            });
          },
          { filter, expand }
        );
        if (cancelled) {
          unsub();
        } else {
          unsubscribe = unsub;
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [collection, enabled, filter, sort, expand]);

  return { items, setItems, loading, error };
}
