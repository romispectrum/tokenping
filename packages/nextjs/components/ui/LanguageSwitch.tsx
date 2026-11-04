"use client";

import { type FocusEvent, type KeyboardEvent, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import { cx } from "~~/components/ui/classNames";
import { useOutsideClick } from "~~/hooks/scaffold-eth";
import { useLocale, useMessages } from "~~/i18n/LocaleProvider";
import { LOCALES, LOCALE_INFO, type Locale } from "~~/i18n/locales";
import { translatePath } from "~~/i18n/routes";

const BUTTON_CLASS_NAME =
  "inline-flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-foreground transition-colors duration-200 ease-[ease] hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring pointer-coarse:min-h-11 [&::-webkit-details-marker]:hidden";

const OPTION_CLASS_NAME =
  "flex min-h-10 items-center justify-between gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150 ease-[ease] hover:bg-accent hover:text-accent-foreground aria-[current=true]:bg-accent aria-[current=true]:text-accent-foreground pointer-coarse:min-h-11";

type MenuEntry = { locale: Locale; name: string; short: string; hreflang: string };

/**
 * One entry per language, or one per region where a language lists them (English (UK) and (US), Deutsch in Germany,
 * Austria and Switzerland: the same pages), sorted by the short label the way a country list reads.
 */
const MENU_ENTRIES: readonly MenuEntry[] = LOCALES.flatMap(locale => {
  const { name, short, htmlLang, regions } = LOCALE_INFO[locale];
  return regions?.length
    ? regions.map(region => ({ locale, ...region }))
    : [{ locale, name, short, hreflang: htmlLang }];
}).sort((a, b) => a.short.localeCompare(b.short, "en"));

/**
 * The language menu: a button with the current language's code that drops down a list of every language, each a
 * link to this page in that language, every entry of the current one marked. Plain <a> links on purpose, not
 * next/link: every prefixed language shares app/(intl)/[lang]/layout.tsx, so a client navigation between two of them
 * would keep the document and remount the providers; a full page load gets the new language's <html> and client root.
 * A disclosure like the header's menu rather than a <select>, so a keyboard arrow never navigates by itself; it closes
 * on Escape (focus back on the button), on a click outside and when focus leaves it. Each option is spoken in its own
 * language (lang). The button is sized like ThemeToggle, with the same accent hover.
 */
export const LanguageSwitch = ({ className }: { className?: string }) => {
  const pathname = usePathname() ?? "/";
  const current = useLocale();
  const t = useMessages("common").header;
  const menuRef = useRef<HTMLDetailsElement>(null);

  const close = useCallback(() => {
    menuRef.current?.removeAttribute("open");
  }, []);
  useOutsideClick(menuRef, close);

  // <details> has no Escape handling of its own.
  const closeOnEscape = (event: KeyboardEvent<HTMLDetailsElement>) => {
    if (event.key !== "Escape" || !menuRef.current?.open) return;
    close();
    menuRef.current.querySelector("summary")?.focus();
  };

  // Tabbing past the last option (or back past the button) closes the list.
  const closeOnFocusLeave = (event: FocusEvent<HTMLDetailsElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && !event.currentTarget.contains(next)) close();
  };

  return (
    <details
      ref={menuRef}
      className={cx("group relative", className)}
      onKeyDown={closeOnEscape}
      onBlur={closeOnFocusLeave}
    >
      {/* The name says what the button is and which language is on: "Language: English". */}
      <summary aria-label={`${t.language}: ${LOCALE_INFO[current].name}`} className={BUTTON_CLASS_NAME}>
        <Globe aria-hidden="true" className="size-4" />
        <span>{LOCALE_INFO[current].short}</span>
        <ChevronDown
          aria-hidden="true"
          className="size-3.5 transition-transform duration-150 ease-[ease] group-open:rotate-180"
        />
      </summary>
      {/* Scrolls inside itself: the list is longer than a phone screen. */}
      <ul className="absolute top-full right-0 z-50 m-0 mt-2 max-h-[min(28rem,calc(100dvh-6rem))] min-w-64 list-none overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-frame">
        {MENU_ENTRIES.map(({ locale, name, short, hreflang }) => {
          const isCurrent = locale === current;
          return (
            <li key={hreflang} className="m-0 p-0">
              <a
                href={translatePath(pathname, locale)}
                hrefLang={hreflang}
                lang={hreflang}
                aria-current={isCurrent ? "true" : undefined}
                className={OPTION_CLASS_NAME}
              >
                <span>{name}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span aria-hidden="true">{short}</span>
                  {isCurrent ? <Check aria-hidden="true" className="size-4" /> : null}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </details>
  );
};
