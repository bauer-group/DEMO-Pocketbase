import { useState, type FormEvent } from "react";
import { Plus, Paperclip } from "lucide-react";
import type { NoteStatus, Tag } from "@/lib/types";
import type { NoteInput } from "@/hooks/useNotes";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/errors";
import { useToast } from "@/providers/ToastProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { fieldBase } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface NoteEditorDialogProps {
  tags: Tag[];
  onCreate: (input: NoteInput) => Promise<void>;
}

const STATUS_OPTIONS: { value: NoteStatus; label: string }[] = [
  { value: "draft", label: "Entwurf" },
  { value: "published", label: "Veröffentlicht" },
  { value: "archived", label: "Archiviert" },
];

export function NoteEditorDialog({ tags, onCreate }: NoteEditorDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<NoteStatus>("draft");
  const [pinned, setPinned] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  function reset() {
    setTitle("");
    setContent("");
    setStatus("draft");
    setPinned(false);
    setSelectedTags([]);
    setFiles([]);
  }

  function toggleTag(id: string) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await onCreate({
        title: title.trim(),
        // Plain-Text in einen Absatz verpacken (editor-Feld erwartet HTML).
        content: content.trim() ? `<p>${content.trim()}</p>` : "",
        status,
        pinned,
        tags: selectedTags,
        attachments: files,
      });
      toast({ title: "Notiz erstellt", variant: "success" });
      reset();
      setOpen(false);
    } catch (err) {
      toast({ title: "Fehler", description: getErrorMessage(err), variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (setOpen(o), !o && reset())}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Neue Notiz
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Neue Notiz"
        description="Inhalt, Status, Tags und Anhänge – alles über die PocketBase-API."
      >
        <form onSubmit={submit} className="space-y-4">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel"
            required
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Was gibt es Neues?"
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-300">
                Status
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as NoteStatus)}
                className={cn(fieldBase, "h-[38px]")}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex cursor-pointer items-end gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="font-medium text-slate-600 dark:text-slate-300">
                Anpinnen
              </span>
            </label>
          </div>

          {tags.length > 0 && (
            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
                Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => {
                  const active = selectedTags.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 transition-colors",
                        active
                          ? "bg-brand-600 text-white ring-brand-600"
                          : "bg-transparent text-slate-600 ring-slate-300 hover:bg-slate-100 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
                      )}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-500 hover:border-brand-400 dark:border-slate-700">
            <Paperclip className="h-4 w-4" />
            <span>
              {files.length > 0
                ? `${files.length} Datei(en) ausgewählt`
                : "Bilder oder PDF anhängen"}
            </span>
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </label>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedTags.map((id) => {
                const t = tags.find((x) => x.id === id);
                return t ? (
                  <Badge key={id} tone="brand" dot={t.color}>
                    {t.name}
                  </Badge>
                ) : null;
              })}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Abbrechen
              </Button>
            </DialogClose>
            <Button type="submit" loading={busy} disabled={!title.trim()}>
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
