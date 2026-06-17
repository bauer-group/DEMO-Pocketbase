import { useEffect, useState } from "react";
import { pb } from "@/lib/pb";
import type { WorkspaceStats } from "@/lib/types";
import { getErrorMessage } from "@/lib/errors";

// Holt aggregierte Statistiken vom Custom-Endpoint /api/demo/stats/{workspace}.
// `refreshKey` neu setzen -> erneuter Abruf (z. B. nach Mutationen).
export function useStats(workspaceId: string | null, refreshKey: unknown) {
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setStats(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await pb.send<WorkspaceStats>(
          `/api/demo/stats/${workspaceId}`,
          { method: "GET" }
        );
        if (!cancelled) setStats(res);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, refreshKey]);

  return { stats, loading, error };
}
