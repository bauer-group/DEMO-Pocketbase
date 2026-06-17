import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// Glassiges Karten-Surface – Basis fast aller Container im UI.
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur",
        "dark:border-slate-800/70 dark:bg-slate-900/70",
        className
      )}
      {...props}
    />
  );
}
