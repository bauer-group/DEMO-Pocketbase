import { useEffect, useState } from "react";
import type { Note, NoteStatus, UserRecord } from "@/lib/types";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useNotes } from "@/hooks/useNotes";
import { useTags } from "@/hooks/useTags";
import { useActivity } from "@/hooks/useActivity";
import { useStats } from "@/hooks/useStats";
import { useToast } from "@/providers/ToastProvider";
import { getErrorMessage } from "@/lib/errors";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { NotesBoard } from "@/components/notes/NotesBoard";
import { NoteDetailDialog } from "@/components/notes/NoteDetailDialog";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { EmptyState } from "@/components/ui/empty-state";
import { LayoutGrid } from "lucide-react";

type StatusFilter = NoteStatus | "all";

interface AppShellProps {
  user: UserRecord | null;
  onLogout: () => void;
}

export function AppShell({ user, onLogout }: AppShellProps) {
  const { toast } = useToast();
  const { workspaces, loading: wsLoading, createWorkspace } = useWorkspaces(true);

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [tagId, setTagId] = useState<string | null>(null);
  const [detailNote, setDetailNote] = useState<Note | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Erstes/weiterhin gültiges Workspace automatisch wählen.
  useEffect(() => {
    if (workspaces.length === 0) {
      setWorkspaceId(null);
      return;
    }
    if (!workspaceId || !workspaces.some((w) => w.id === workspaceId)) {
      setWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, workspaceId]);

  // Filter beim Workspace-Wechsel zurücksetzen.
  useEffect(() => {
    setTagId(null);
    setStatus("all");
    setSearch("");
  }, [workspaceId]);

  const { tags } = useTags(workspaceId);
  const notesApi = useNotes(workspaceId, { status, tagId, search });
  const { activities, loading: actLoading } = useActivity(workspaceId);
  const { stats, loading: statsLoading } = useStats(
    workspaceId,
    `${notesApi.notes.length}:${activities.length}`
  );

  const workspace = workspaces.find((w) => w.id === workspaceId) ?? null;

  function openNote(note: Note) {
    setDetailNote(note);
    setDetailOpen(true);
  }
  // Detail-Note mit Realtime-Updates synchron halten.
  const liveDetail = detailNote
    ? notesApi.notes.find((n) => n.id === detailNote.id) ?? detailNote
    : null;

  async function handleCreateWorkspace(name: string) {
    try {
      const ws = await createWorkspace(name);
      setWorkspaceId(ws.id);
      toast({ title: "Workspace erstellt", variant: "success" });
    } catch (err) {
      toast({ title: "Fehler", description: getErrorMessage(err), variant: "error" });
    }
  }

  async function handleDelete(note: Note) {
    try {
      await notesApi.deleteNote(note.id);
      toast({ title: "Notiz gelöscht", variant: "success" });
    } catch (err) {
      toast({ title: "Fehler", description: getErrorMessage(err), variant: "error" });
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="hidden w-64 shrink-0 border-r border-slate-200/70 bg-white/40 md:block dark:border-slate-800/70 dark:bg-slate-900/30">
        <Sidebar
          workspaces={workspaces}
          loading={wsLoading}
          selectedId={workspaceId}
          onSelect={setWorkspaceId}
          onCreate={handleCreateWorkspace}
        />
      </div>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          workspace={workspace}
          search={search}
          onSearch={setSearch}
          onLogout={onLogout}
        />

        <div className="flex min-h-0 flex-1">
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {!workspace && !wsLoading ? (
              <EmptyState
                className="mt-10"
                icon={<LayoutGrid className="h-6 w-6" />}
                title="Kein Workspace"
                description="Lege links einen Workspace an, um loszulegen."
              />
            ) : (
              <div className="mx-auto max-w-5xl space-y-6">
                <StatsBar stats={stats} loading={statsLoading} />
                <NotesBoard
                  notes={notesApi.notes}
                  loading={notesApi.loading}
                  error={notesApi.error}
                  status={status}
                  onStatusChange={setStatus}
                  tags={tags}
                  tagId={tagId}
                  onTagChange={setTagId}
                  onCreate={notesApi.createNote}
                  onOpenNote={openNote}
                  onTogglePin={notesApi.togglePin}
                  onDelete={handleDelete}
                />
              </div>
            )}
          </main>

          {/* Activity-Rail */}
          <aside className="hidden w-80 shrink-0 overflow-hidden border-l border-slate-200/70 bg-white/40 p-4 xl:block dark:border-slate-800/70 dark:bg-slate-900/30">
            <ActivityFeed activities={activities} loading={actLoading} />
          </aside>
        </div>
      </div>

      <NoteDetailDialog
        note={liveDetail}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
