import { FileText } from "lucide-react";
import type { Note } from "@/lib/types";
import { fileUrl } from "@/lib/pb";
import { timeAgo } from "@/lib/format";
import { sanitizeHtml } from "@/lib/sanitize";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { CommentThread } from "@/components/comments/CommentThread";
import { STATUS_META, isImage } from "./status";

interface NoteDetailDialogProps {
  note: Note | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NoteDetailDialog({ note, open, onOpenChange }: NoteDetailDialogProps) {
  if (!note) return null;
  const status = STATUS_META[note.status];
  const tags = note.expand?.tags ?? [];
  const author = note.expand?.author;
  const images = (note.attachments ?? []).filter(isImage);
  const docs = (note.attachments ?? []).filter((a) => !isImage(a));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={note.title} className="max-w-2xl">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
            {tags.map((t) => (
              <Badge key={t.id} tone="slate" dot={t.color}>
                {t.name}
              </Badge>
            ))}
            <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
              <Avatar name={author?.name} email={author?.email} className="h-5 w-5 ring-0" />
              {author?.name} · {timeAgo(note.created)}
            </span>
          </div>

          {note.content && (
            <div
              className="prose-note text-base"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content) }}
            />
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {images.map((img) => (
                <a
                  key={img}
                  href={fileUrl(note, img)}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
                >
                  <img
                    src={fileUrl(note, img, "100x100")}
                    alt=""
                    className="aspect-square w-full object-cover transition-transform hover:scale-105"
                  />
                </a>
              ))}
            </div>
          )}

          {docs.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {docs.map((d) => (
                <a
                  key={d}
                  href={fileUrl(note, d)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <FileText className="h-4 w-4 text-brand-500" />
                  <span className="truncate">{d}</span>
                </a>
              ))}
            </div>
          )}

          <hr className="border-slate-200 dark:border-slate-800" />

          <CommentThread noteId={note.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
