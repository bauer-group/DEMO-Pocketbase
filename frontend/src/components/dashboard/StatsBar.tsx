import { FileText, CheckCircle2, Users, Activity as ActivityIcon } from "lucide-react";
import type { WorkspaceStats } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsBarProps {
  stats: WorkspaceStats | null;
  loading: boolean;
}

export function StatsBar({ stats, loading }: StatsBarProps) {
  const cells = [
    {
      icon: FileText,
      label: "Notizen",
      value: stats?.notes.total,
      tone: "text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/15",
    },
    {
      icon: CheckCircle2,
      label: "Veröffentlicht",
      value: stats?.notes.byStatus.published,
      tone: "text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-500/15",
    },
    {
      icon: Users,
      label: "Mitglieder",
      value: stats?.members,
      tone: "text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15",
    },
    {
      icon: ActivityIcon,
      label: "Aktivitäten",
      value: stats?.activities,
      tone: "text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/15",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cells.map((c) => (
        <Card key={c.label} className="flex items-center gap-3 p-4">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.tone}`}>
            <c.icon className="h-5 w-5" />
          </span>
          <div>
            {loading && c.value === undefined ? (
              <Skeleton className="h-6 w-10" />
            ) : (
              <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {c.value ?? 0}
              </div>
            )}
            <div className="text-xs text-slate-500 dark:text-slate-400">{c.label}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
