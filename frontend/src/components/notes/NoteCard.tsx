import { Pin, MoreVertical, Trash2, MessageSquare, Paperclip } from "lucide-react";
import type { Note } from "@/lib/types";
import { fileUrl } from "@/lib/pb";
import { timeAgo } from "@/lib/format";
import { sanitizeHtml } from "@/lib/sanitize";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { STATUS_META, isImage } from "./status";

interface NoteCardProps {
  note: Note;
  onOpen: (note: Note) => void;
  onTogglePin: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export function NoteCard({ note, onOpen, onTogglePin, onDelete }: NoteCardProps) {
  const status = STATUS_META[note.status];
  const tags = note.expand?.tags ?? [];
  const author = note.expand?.author;
  const cover = note.attachments?.find((a) => isImage(a));

  return (
    <Card
      className="group flex cursor-pointer flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md animate-in-up"
      onClick={() => onOpen(note)}
    >
      {cover && (
        <img
          src={fileUrl(note, cover, "600x0")}
          alt=""
          loading="lazy"
          className="h-32 w-full object-cover"
        />
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
            {note.pinned && (
              <Pin className="h-3.5 w-3.5 fill-brand-500 text-brand-500" />
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="rounded-md p-1 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 group-hover:opacity-100 dark:hover:bg-slate-800"
              aria-label="Aktionen"
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onSelect={() => onTogglePin(note)}>
                <Pin className="h-4 w-4" />
                {note.pinned ? "Pin entfernen" : "Anpinnen"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onDelete(note)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4" /> Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            {note.title}
          </h3>
          <div
            className="prose-note mt-1 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content) }}
          />
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Badge key={t.id} tone="slate" dot={t.color}>
                {t.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-1 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Avatar
              name={author?.name}
              email={author?.email}
              className="h-5 w-5 ring-0"
            />
            <span>{author?.name ?? "Unbekannt"}</span>
          </div>
          <div className="flex items-center gap-3">
            {note.attachments?.length > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip className="h-3.5 w-3.5" /> {note.attachments.length}
              </span>
            )}
            <span className={cn("flex items-center gap-1")}>
              <MessageSquare className="h-3.5 w-3.5" />
            </span>
            <span>{timeAgo(note.created)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
