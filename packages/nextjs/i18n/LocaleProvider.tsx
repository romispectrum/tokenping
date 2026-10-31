"use client";

import { type ReactNode, createContext, useContext } from "react";
import { fallbackMessages } from "~~/i18n/client/fallback";
import type { ClientMessages } from "~~/i18n/client/messages";
import { DEFAULT_LOCALE, type Locale } from "~~/i18n/locales";

// The page's language and its strings for client components. Each root layout mounts its language's provider
// (i18n/client/<locale>.tsx), so a page's JavaScript carries that one language only. Server components get the locale
// as a prop and read the full message objects instead.
type LocaleContextValue = { locale: Locale; messages?: ClientMessages };

const LocaleContext = createContext<LocaleContextValue>({ locale: DEFAULT_LOCALE });

export const LocaleProvider = ({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  /** Left out only in tests, where i18n/client/fallback serves every language. */
  messages?: ClientMessages;
  children: ReactNode;
}) => <LocaleContext.Provider value={{ locale, messages }}>{children}</LocaleContext.Provider>;

export const useLocale = () => useContext(LocaleContext).locale;

/** One area's strings in the page's language: `const t = useMessages("dashboard")`. */
export const useMessages = <Area extends keyof ClientMessages>(area: Area): ClientMessages[Area] => {
  const { locale, messages } = useContext(LocaleContext);
  return (messages ?? fallbackMessages(locale))[area];
};
