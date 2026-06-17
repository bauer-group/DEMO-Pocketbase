import * as Dropdown from "@radix-ui/react-dropdown-menu";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export const DropdownMenu = Dropdown.Root;
export const DropdownMenuTrigger = Dropdown.Trigger;

export function DropdownMenuContent({
  className,
  align = "end",
  ...props
}: ComponentPropsWithoutRef<typeof Dropdown.Content>) {
  return (
    <Dropdown.Portal>
      <Dropdown.Content
        align={align}
        sideOffset={6}
        className={cn(
          "z-50 min-w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg",
          "data-[state=open]:animate-in-up dark:border-slate-800 dark:bg-slate-900",
          className
        )}
        {...props}
      />
    </Dropdown.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Dropdown.Item>) {
  return (
    <Dropdown.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 outline-none",
        "focus:bg-slate-100 data-[highlighted]:bg-slate-100 dark:text-slate-200 dark:focus:bg-slate-800 dark:data-[highlighted]:bg-slate-800",
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator() {
  return <Dropdown.Separator className="my-1 h-px bg-slate-200 dark:bg-slate-800" />;
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Dropdown.Label>) {
  return (
    <Dropdown.Label
      className={cn(
        "px-2.5 py-1.5 text-xs font-medium text-slate-400",
        className
      )}
      {...props}
    />
  );
}
