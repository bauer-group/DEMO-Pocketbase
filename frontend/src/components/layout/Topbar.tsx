import { Search, LogOut, ChevronDown } from "lucide-react";
import type { UserRecord, Workspace } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  user: UserRecord | null;
  workspace: Workspace | null;
  search: string;
  onSearch: (q: string) => void;
  onLogout: () => void;
}

export function Topbar({ user, workspace, search, onSearch, onLogout }: TopbarProps) {
  return (
    <header className="flex items-center gap-3 border-b border-slate-200/70 bg-white/60 px-4 py-3 backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/40">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
          {workspace?.name ?? "Kein Workspace"}
        </h1>
        {workspace?.description && (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {workspace.description}
          </p>
        )}
      </div>

      <div className="relative hidden sm:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Notizen durchsuchen…"
          className="w-56 pl-8"
        />
      </div>

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60">
          <Avatar name={user?.name} email={user?.email} />
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>
            {user?.name || user?.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onLogout} className="text-red-600 dark:text-red-400">
            <LogOut className="h-4 w-4" /> Abmelden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
