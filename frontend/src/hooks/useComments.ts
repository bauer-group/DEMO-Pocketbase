import { useCallback, useMemo } from "react";
import { pb, currentUser } from "@/lib/pb";
import type { Comment } from "@/lib/types";
import { useRealtimeList } from "./useRealtimeList";

// Kommentar-Thread einer Note (chronologisch) inkl. Realtime.
export function useComments(noteId: string | null) {
  const filter = useMemo(
    () => (noteId ? pb.filter("note = {:n}", { n: noteId }) : undefined),
    [noteId]
  );

  const { items, loading, error } = useRealtimeList<Comment>("comments", {
    enabled: !!noteId,
    filter,
    sort: "created",
    expand: "author",
  });

  const addComment = useCallback(
    async (body: string) => {
      const me = currentUser();
      if (!me || !noteId) throw new Error("Kein Login/Note");
      await pb
        .collection("comments")
        .create({ note: noteId, author: me.id, body }, { expand: "author" });
    },
    [noteId]
  );

  const deleteComment = useCallback(async (id: string) => {
    await pb.collection("comments").delete(id);
  }, []);

  return { comments: items, loading, error, addComment, deleteComment };
}
