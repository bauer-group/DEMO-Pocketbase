import {
  FilePlus2,
  MessageSquarePlus,
  FolderPlus,
  Activity as ActivityIcon,
} from "lucide-react";
import type { Activity } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const ACTION_META: Record<string, { icon: typeof ActivityIcon; verb: string }> = {
  "workspace.created": { icon: FolderPlus, verb: "hat den Workspace erstellt" },
  "note.created": { icon: FilePlus2, verb: "hat eine Notiz erstellt" },
  "comment.created": { icon: MessageSquarePlus, verb: "hat kommentiert bei" },
};

export function ActivityFeed({
  activities,
  loading,
}: {
  activities: Activity[];
  loading: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <ActivityIcon className="h-4 w-4 text-brand-500" />
        Aktivität
        <span className="ml-1 inline-flex h-2 w-2 animate-pulse rounded-full bg-green-500" />
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto pr-1">
        {loading && activities.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))
        ) : activities.length === 0 ? (
          <p className="text-sm text-slate-400">Noch keine Aktivität.</p>
        ) : (
          activities.slice(0, 30).map((a) => {
            const meta = ACTION_META[a.action] ?? {
              icon: ActivityIcon,
              verb: a.action,
            };
            return (
              <div key={a.id} className="flex gap-2.5 animate-in-up">
                <Avatar
                  name={a.expand?.actor?.name}
                  email={a.expand?.actor?.email}
                  className="h-7 w-7 ring-0"
                />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="text-slate-600 dark:text-slate-300">
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {a.expand?.actor?.name ?? "Jemand"}
                    </span>{" "}
                    {meta.verb}
                    {a.subject && (
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {" "}
                        „{a.subject}"
                      </span>
                    )}
                  </p>
                  <span className="text-xs text-slate-400">{timeAgo(a.created)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
