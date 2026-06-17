import { FileText } from "lucide-react";
import type { Note, NoteStatus, Tag } from "@/lib/types";
import type { NoteInput } from "@/hooks/useNotes";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteCard } from "./NoteCard";
import { NoteEditorDialog } from "./NoteEditorDialog";

type StatusFilter = NoteStatus | "all";

interface NotesBoardProps {
  notes: Note[];
  loading: boolean;
  error: string | null;
  status: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  tags: Tag[];
  tagId: string | null;
  onTagChange: (id: string | null) => void;
  onCreate: (input: NoteInput) => Promise<void>;
  onOpenNote: (note: Note) => void;
  onTogglePin: (note: Note) => void;
  onDelete: (note: Note) => void;
}

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "published", label: "Veröffentlicht" },
  { value: "draft", label: "Entwürfe" },
  { value: "archived", label: "Archiv" },
];

export function NotesBoard({
  notes,
  loading,
  error,
  status,
  onStatusChange,
  tags,
  tagId,
  onTagChange,
  onCreate,
  onOpenNote,
  onTogglePin,
  onDelete,
}: NotesBoardProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={status}
          onValueChange={(v) => onStatusChange(v as StatusFilter)}
        >
          <TabsList>
            {STATUS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="ml-auto">
          <NoteEditorDialog tags={tags} onCreate={onCreate} />
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onTagChange(null)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
              !tagId
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            Alle Tags
          </button>
          {tags.map((t) => (
            <button
              key={t.id}
              onClick={() => onTagChange(tagId === t.id ? null : t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 transition-colors",
                tagId === t.id
                  ? "bg-brand-600 text-white ring-brand-600"
                  : "text-slate-600 ring-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
              )}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              {t.name}
            </button>
          ))}
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </Card>
      )}

      {loading && notes.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="Keine Notizen"
          description="Erstelle die erste Notiz – oder ändere die Filter."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onOpen={onOpenNote}
              onTogglePin={onTogglePin}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
