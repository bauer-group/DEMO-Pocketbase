import { useState, type FormEvent } from "react";
import { Send, Trash2 } from "lucide-react";
import { useComments } from "@/hooks/useComments";
import { currentUser } from "@/lib/pb";
import { timeAgo } from "@/lib/format";
import { getErrorMessage } from "@/lib/errors";
import { useToast } from "@/providers/ToastProvider";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function CommentThread({ noteId }: { noteId: string }) {
  const { comments, loading, addComment, deleteComment } = useComments(noteId);
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const me = currentUser();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      await addComment(body.trim());
      setBody("");
    } catch (err) {
      toast({ title: "Fehler", description: getErrorMessage(err), variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        Kommentare {comments.length > 0 && `(${comments.length})`}
      </h4>

      <div className="flex max-h-60 flex-col gap-3 overflow-y-auto pr-1">
        {loading && comments.length === 0 ? (
          <div className="flex justify-center py-4 text-slate-400">
            <Spinner />
          </div>
        ) : comments.length === 0 ? (
          <p className="py-2 text-sm text-slate-400">
            Noch keine Kommentare – starte die Diskussion.
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar
                name={c.expand?.author?.name}
                email={c.expand?.author?.email}
                className="h-7 w-7 ring-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {c.expand?.author?.name ?? "Unbekannt"}
                  </span>
                  <span className="text-xs text-slate-400">{timeAgo(c.created)}</span>
                  {c.author === me?.id && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="ml-auto text-slate-300 transition-colors hover:text-red-500"
                      aria-label="Kommentar löschen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{c.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Kommentar schreiben…"
        />
        <Button type="submit" size="icon" loading={busy} disabled={!body.trim()}>
          {!busy && <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
