"use client";

import { type FocusEvent, type KeyboardEvent, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import { cx } from "~~/components/ui/classNames";
import { useOutsideClick } from "~~/hooks/scaffold-eth";
import { useLocale, useMessages } from "~~/i18n/LocaleProvider";
import { LOCALES, LOCALE_INFO } from "~~/i18n/locales";
import { COMMON_MESSAGES } from "~~/i18n/messages/common";
import { translatePath } from "~~/i18n/routes";

const BUTTON_CLASS_NAME =
  "inline-flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-foreground transition-colors duration-200 ease-[ease] hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring pointer-coarse:min-h-11 [&::-webkit-details-marker]:hidden";

const OPTION_CLASS_NAME =
  "flex min-h-10 items-center justify-between gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150 ease-[ease] hover:bg-accent hover:text-accent-foreground aria-[current=true]:bg-accent aria-[current=true]:text-accent-foreground pointer-coarse:min-h-11";

/**
 * The language menu: a button with the current language's code that drops down a list of every language, each a
 * link to this page in that language, the current one marked. Plain <a> links, not next/link: each language has its
 * own root layout, so switching is a full page load either way. A disclosure like the header's menu rather than a
 * <select>, so a keyboard arrow never navigates by itself; it closes on Escape (focus back on the button), on a
 * click outside and when focus leaves it. Each option is spoken in its own language (lang). The button is sized
 * like ThemeToggle, with the same accent hover.
 */
export const LanguageSwitch = ({ className }: { className?: string }) => {
  const pathname = usePathname() ?? "/";
  const current = useLocale();
  const t = useMessages(COMMON_MESSAGES).header;
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
      <ul className="absolute top-full right-0 z-50 m-0 mt-2 min-w-44 list-none rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-frame">
        {LOCALES.map(locale => {
          const { htmlLang, name, short } = LOCALE_INFO[locale];
          const isCurrent = locale === current;
          return (
            <li key={locale} className="m-0 p-0">
              <a
                href={translatePath(pathname, locale)}
                hrefLang={htmlLang}
                lang={htmlLang}
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
