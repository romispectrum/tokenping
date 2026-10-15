"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cx } from "~~/components/ui/classNames";

/**
 * Flips between the light and dark theme. Hydration-safe without a mounted flag: both icons are rendered and CSS
 * shows the right one, so the server HTML never depends on the theme. The icons use theme-dark (the class on
 * <html>), not dark:, so the toggle still reports the light theme when it sits in a dark band. The click reads
 * resolvedTheme, which is known by the time anyone clicks. Hover is the accent surface, focus the global ring,
 * 40px square and 44px on touch screens. For a Light, Dark or System choice use ThemeChoice.
 */
export const ThemeToggle = ({ className }: { className?: string }) => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle light or dark theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cx(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-foreground",
        "transition-colors duration-200 ease-[ease] hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "pointer-coarse:min-h-11 pointer-coarse:min-w-11",
        className,
      )}
    >
      <Sun aria-hidden="true" className="size-4 theme-dark:hidden" />
      <Moon aria-hidden="true" className="hidden size-4 theme-dark:block" />
    </button>
  );
};
