"use client";

import { type ReactNode, createContext, useContext } from "react";
import { DEFAULT_LOCALE, type Locale, type Localized } from "~~/i18n/locales";

// The page's language for client components. Each root layout (app/(en), app/(cs)) provides it; without a provider
// (unit tests) it is English. Server components get the locale as a prop instead.
const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export const LocaleProvider = ({ locale, children }: { locale: Locale; children: ReactNode }) => (
  <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
);

export const useLocale = () => useContext(LocaleContext);

/** One area's strings in the page's language: `const t = useMessages(DASHBOARD_MESSAGES)`. */
export const useMessages = <T,>(messages: Localized<T>): T => messages[useLocale()];
