import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind-bewusstes Klassen-Merging: clsx (bedingt) + tailwind-merge (Konflikte
// wie "p-2 p-4" werden korrekt zu "p-4" aufgelöst). Standard-Helper in jedem
// modernen Tailwind-Projekt.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
