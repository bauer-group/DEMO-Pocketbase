import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Tooltip label={theme === "dark" ? "Heller Modus" : "Dunkler Modus"}>
      <Button variant="ghost" size="icon" onClick={toggle} aria-label="Theme umschalten">
        {theme === "dark" ? (
          <Sun className="h-[18px] w-[18px]" />
        ) : (
          <Moon className="h-[18px] w-[18px]" />
        )}
      </Button>
    </Tooltip>
  );
}
