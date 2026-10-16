"use client";

import { usePathname } from "next/navigation";
import { cx } from "~~/components/ui/classNames";
import { useLocale } from "~~/i18n/LocaleProvider";
import { LOCALES, LOCALE_INFO } from "~~/i18n/locales";
import { translatePath } from "~~/i18n/routes";

/**
 * The link to this page in the other language ("CZ" on an English page, "EN" on a Czech one). A plain <a>, not
 * next/link: each language has its own root layout, so the switch is a full page load either way. The visible
 * label is the short code; the accessible name is the language's own name, spoken in that language (lang). Sized
 * like ThemeToggle, with the same accent hover.
 */
export const LanguageSwitch = ({ className }: { className?: string }) => {
  const pathname = usePathname() ?? "/";
  const current = useLocale();
  const target = LOCALES.find(locale => locale !== current) ?? LOCALES[0];
  const { htmlLang, name, short } = LOCALE_INFO[target];

  return (
    <a
      href={translatePath(pathname, target)}
      hrefLang={htmlLang}
      lang={htmlLang}
      aria-label={name}
      className={cx(
        "inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg px-2 text-sm font-medium text-foreground",
        "transition-colors duration-200 ease-[ease] hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "pointer-coarse:min-h-11 pointer-coarse:min-w-11",
        className,
      )}
    >
      {short}
    </a>
  );
};
