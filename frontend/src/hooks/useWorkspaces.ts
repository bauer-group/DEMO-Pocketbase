import { useCallback } from "react";
import { pb, currentUser } from "@/lib/pb";
import type { Workspace } from "@/lib/types";
import { useRealtimeList } from "./useRealtimeList";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    // Kombinierende Diakritika (U+0300–U+036F) nach der Normalisierung entfernen.
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "workspace";
}

const PALETTE = ["#6366f1", "#0ea5e9", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6"];

// Listet die Workspaces, in denen der User Mitglied ist (RLS regelt den Filter
// serverseitig). Anlegen erzeugt automatisch die Owner-Mitgliedschaft (Hook).
export function useWorkspaces(enabled: boolean) {
  const { items, loading, error } = useRealtimeList<Workspace>("workspaces", {
    enabled,
    sort: "created",
  });

  const createWorkspace = useCallback(
    async (name: string, description = ""): Promise<Workspace> => {
      const me = currentUser();
      if (!me) throw new Error("Nicht eingeloggt");
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      return pb.collection("workspaces").create<Workspace>({
        name,
        slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
        description,
        color,
        owner: me.id,
      });
    },
    []
  );

  return { workspaces: items, loading, error, createWorkspace };
}
