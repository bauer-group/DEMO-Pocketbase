import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "green" | "amber" | "red" | "slate";

const tones: Record<Tone, string> = {
  neutral:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  brand:
    "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  green: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  red: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  slate: "bg-slate-900/5 text-slate-600 dark:bg-white/5 dark:text-slate-300",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: string; // optionale Farb-Punkt (z. B. Tag-Farbe)
}

export function Badge({ className, tone = "neutral", dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: dot }}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}
