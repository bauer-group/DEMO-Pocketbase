import { useMemo } from "react";
import { pb } from "@/lib/pb";
import type { Activity } from "@/lib/types";
import { useRealtimeList } from "./useRealtimeList";

// Live-Activity-Feed eines Workspaces. Die Einträge schreibt PocketBase
// serverseitig per Event-Hook – der Client kann sie nur lesen.
export function useActivity(workspaceId: string | null) {
  const filter = useMemo(
    () =>
      workspaceId ? pb.filter("workspace = {:w}", { w: workspaceId }) : undefined,
    [workspaceId]
  );

  const { items, loading, error } = useRealtimeList<Activity>("activities", {
    enabled: !!workspaceId,
    filter,
    sort: "-created",
    expand: "actor",
  });

  return { activities: items, loading, error };
}
