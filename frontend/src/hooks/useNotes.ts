import { useCallback, useMemo } from "react";
import { pb, currentUser } from "@/lib/pb";
import type { Note, NoteStatus } from "@/lib/types";
import { useRealtimeList } from "./useRealtimeList";

export interface NoteFilters {
  status?: NoteStatus | "all";
  tagId?: string | null;
  search?: string;
}

export interface NoteInput {
  title: string;
  content: string;
  status: NoteStatus;
  pinned?: boolean;
  tags?: string[];
  attachments?: File[];
}

// CRUD + Realtime für die Notizen eines Workspaces. Der Filter wird
// PocketBase-seitig ausgewertet (Liste UND Realtime-Events).
export function useNotes(workspaceId: string | null, filters: NoteFilters) {
  const filter = useMemo(() => {
    if (!workspaceId) return undefined;
    const parts = [pb.filter("workspace = {:w}", { w: workspaceId })];
    if (filters.status && filters.status !== "all") {
      parts.push(pb.filter("status = {:s}", { s: filters.status }));
    }
    if (filters.tagId) {
      parts.push(pb.filter("tags ~ {:t}", { t: filters.tagId }));
    }
    if (filters.search && filters.search.trim()) {
      parts.push(
        pb.filter("(title ~ {:q} || content ~ {:q})", { q: filters.search.trim() })
      );
    }
    return parts.join(" && ");
  }, [workspaceId, filters.status, filters.tagId, filters.search]);

  // Gepinnte zuerst, dann nach Datum.
  const { items, loading, error } = useRealtimeList<Note>("notes", {
    enabled: !!workspaceId,
    filter,
    sort: "-pinned,-created",
    expand: "author,tags",
  });

  const createNote = useCallback(
    async (input: NoteInput) => {
      const me = currentUser();
      if (!me || !workspaceId) throw new Error("Kein Workspace/Login");

      const fd = new FormData();
      fd.append("workspace", workspaceId);
      fd.append("author", me.id);
      fd.append("title", input.title);
      fd.append("content", input.content);
      fd.append("status", input.status);
      fd.append("pinned", String(!!input.pinned));
      (input.tags ?? []).forEach((t) => fd.append("tags", t));
      (input.attachments ?? []).forEach((f) => fd.append("attachments", f));

      await pb.collection("notes").create(fd, { expand: "author,tags" });
    },
    [workspaceId]
  );

  const updateNote = useCallback(
    async (id: string, data: Partial<Note>) => {
      await pb.collection("notes").update(id, data, { expand: "author,tags" });
    },
    []
  );

  const togglePin = useCallback(async (note: Note) => {
    await pb
      .collection("notes")
      .update(note.id, { pinned: !note.pinned }, { expand: "author,tags" });
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    await pb.collection("notes").delete(id);
  }, []);

  return {
    notes: items,
    loading,
    error,
    createNote,
    updateNote,
    togglePin,
    deleteNote,
  };
}
