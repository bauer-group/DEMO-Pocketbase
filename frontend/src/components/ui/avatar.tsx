import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

interface AvatarProps {
  name?: string;
  email?: string;
  src?: string;
  className?: string;
}

// Deterministische Hintergrundfarbe aus dem Namen (stabil pro User).
function hueFrom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export function Avatar({ name, email, src, className }: AvatarProps) {
  const seed = name || email || "?";
  const hue = hueFrom(seed);
  return (
    <AvatarPrimitive.Root
      className={cn(
        "inline-flex h-8 w-8 shrink-0 select-none items-center justify-center overflow-hidden rounded-full ring-2 ring-white dark:ring-slate-900",
        className
      )}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={seed}
          className="h-full w-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center text-xs font-semibold text-white"
        style={{ backgroundColor: `hsl(${hue} 65% 45%)` }}
      >
        {initials(name, email)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
