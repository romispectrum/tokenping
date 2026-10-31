"use client";

import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { LocaleProvider } from "~~/i18n/LocaleProvider";
import type { ClientMessages } from "~~/i18n/client/messages";
import type { Locale } from "~~/i18n/locales";

/**
 * Everything on the client that wraps a page: the theme, the page's language and strings, the wallet providers and
 * analytics. Each language's root (i18n/client/<locale>.tsx) renders it, so the only client component a root layout
 * references is its own language's root. A client component that every layout referenced directly was mapped to one
 * layout's chunks (the last one built), and every page then loaded that layout's code and that language's strings.
 */
export const ClientRoot = ({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: ClientMessages;
  children: ReactNode;
}) => (
  <>
    <ThemeProvider attribute={["class", "data-theme"]} defaultTheme="light" enableSystem disableTransitionOnChange>
      <LocaleProvider locale={locale} messages={messages}>
        <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
      </LocaleProvider>
    </ThemeProvider>
    {/* Vercel Web Analytics: cookieless page counts (see the privacy page). The IPFS build has no Vercel endpoint to
        report to, so it is left out there; in development it only logs to the console. */}
    {process.env.NEXT_PUBLIC_IPFS_BUILD !== "true" && <Analytics />}
  </>
);
