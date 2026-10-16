"use client";

import { useEffect, useId, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cx } from "~~/components/ui/classNames";
import { useMessages } from "~~/i18n/LocaleProvider";
import { COMMON_MESSAGES } from "~~/i18n/messages/common";

// The value is also the option's key in COMMON_MESSAGES.theme.
const THEME_OPTIONS = [
  { value: "light", Icon: Sun },
  { value: "dark", Icon: Moon },
  { value: "system", Icon: Monitor },
] as const;

/**
 * Light, Dark or System, for a footer or a settings page; ThemeToggle is the one-click flip for a top bar. Native
 * radio buttons (arrow keys move between them) drawn on the tabs recipe: a muted track, the chosen option on the
 * page colour (accent on dark) with the --input boundary, hover only darkens the text, never pink. The stored
 * choice is only known in the browser, so nothing is checked before hydration.
 */
export const ThemeChoice = ({ className }: { className?: string }) => {
  const { theme, setTheme } = useTheme();
  const t = useMessages(COMMON_MESSAGES).theme;
  const [mounted, setMounted] = useState(false);
  const name = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <fieldset className={cx("inline-flex w-fit items-center gap-1 rounded-xl bg-muted p-1", className)}>
      <legend className="sr-only">{t.legend}</legend>
      {THEME_OPTIONS.map(({ value, Icon }) => (
        <label
          key={value}
          className={cx(
            "inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-transparent px-3",
            "text-sm font-medium text-muted-foreground transition-colors duration-200 ease-[ease] hover:text-foreground",
            "has-checked:border-input has-checked:bg-background has-checked:text-foreground dark:has-checked:bg-accent",
            "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
            "pointer-coarse:min-h-11",
          )}
        >
          <input
            type="radio"
            name={name}
            value={value}
            checked={mounted && theme === value}
            onChange={() => setTheme(value)}
            className="sr-only"
          />
          <Icon aria-hidden="true" className="size-4" />
          {t[value]}
        </label>
      ))}
    </fieldset>
  );
};
