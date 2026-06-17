import { useState, type FormEvent } from "react";
import { Plus, Sparkles, Hash } from "lucide-react";
import type { Workspace } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface SidebarProps {
  workspaces: Workspace[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<void>;
}

export function Sidebar({
  workspaces,
  loading,
  selectedId,
  onSelect,
  onCreate,
}: SidebarProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onCreate(name.trim());
      setName("");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="flex h-full w-full flex-col gap-4 p-4">
      <div className="flex items-center gap-2 px-2 text-base font-semibold text-slate-900 dark:text-slate-100">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        Collab
      </div>

      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Workspaces
        </span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" aria-label="Workspace anlegen">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent
            title="Neuer Workspace"
            description="Lege einen kollaborativen Bereich an. Du wirst automatisch Owner."
          >
            <form onSubmit={create} className="space-y-4">
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z. B. Marketing 2026"
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Abbrechen
                  </Button>
                </DialogClose>
                <Button type="submit" loading={busy} disabled={!name.trim()}>
                  Anlegen
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {loading && workspaces.length === 0
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))
          : workspaces.map((ws) => {
              const active = ws.id === selectedId;
              return (
                <button
                  key={ws.id}
                  onClick={() => onSelect(ws.id)}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                    active
                      ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-md text-white"
                    style={{ backgroundColor: ws.color || "#6366f1" }}
                  >
                    <Hash className="h-3.5 w-3.5" />
                  </span>
                  <span className="truncate">{ws.name}</span>
                </button>
              );
            })}
      </nav>
    </aside>
  );
}
