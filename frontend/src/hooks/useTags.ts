import { useCallback, useMemo } from "react";
import { pb } from "@/lib/pb";
import type { Tag } from "@/lib/types";
import { useRealtimeList } from "./useRealtimeList";

export function useTags(workspaceId: string | null) {
  const filter = useMemo(
    () =>
      workspaceId ? pb.filter("workspace = {:w}", { w: workspaceId }) : undefined,
    [workspaceId]
  );

  const { items, loading } = useRealtimeList<Tag>("tags", {
    enabled: !!workspaceId,
    filter,
    sort: "name",
  });

  const createTag = useCallback(
    async (name: string, color: string) => {
      if (!workspaceId) return;
      await pb.collection("tags").create({ workspace: workspaceId, name, color });
    },
    [workspaceId]
  );

  return { tags: items, loading, createTag };
}
