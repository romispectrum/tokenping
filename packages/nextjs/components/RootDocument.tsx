import type { ReactNode } from "react";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "@scaffold-ui/components/styles.css";
import type { Viewport } from "next";
import { THEME_COLOR } from "~~/components/brand/themeColor";
import { LOCALE_INFO, type Locale } from "~~/i18n/locales";
import "~~/styles/globals.css";

// Satoshi, the only typeface for words. The variable font's real weight axis is 300 to 900. Each face is its own
// localFont so that only the upright one is preloaded: the italic (MDX emphasis, the blog disclaimers) is on few pages,
// and preloading it on every page took bandwidth from the first paint. Both name the family "Satoshi" in their
// @font-face, so they stay one family and italic text gets the real italic, not a slanted copy of the upright face.
const satoshi = localFont({
  src: "../app/fonts/Satoshi-Variable.woff2",
  weight: "300 900",
  style: "normal",
  declarations: [{ prop: "font-family", value: "Satoshi" }],
  variable: "--font-satoshi",
  display: "swap",
});

// Fetched only where italic text is shown. Nothing reads its variable: the class is on <html> only to reference it.
const satoshiItalic = localFont({
  src: "../app/fonts/Satoshi-VariableItalic.woff2",
  weight: "300 900",
  style: "italic",
  declarations: [{ prop: "font-family", value: "Satoshi" }],
  variable: "--font-satoshi-italic",
  display: "swap",
  preload: false,
  // The upright face's metric-matched fallback already covers the family.
  adjustFontFallback: false,
});

// Data only: addresses, hashes, tx ids and digit-compared numbers (the font-data utility). Not preloaded: most
// pages show no data, and a preload would compete with the hero text for bandwidth.
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
});

/** Each root layout exports this as its `viewport`. */
export const ROOT_VIEWPORT: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  // One static value: the app is light by default whatever the OS says. ThemeProvider switches it with the theme.
  themeColor: THEME_COLOR.light,
  colorScheme: "light dark",
};

type RootDocumentProps = {
  locale: Locale;
  /**
   * The page inside its language's client root (i18n/client/<locale>.tsx, or i18n/client/roots.tsx for the prefixed
   * languages): providers and the page's strings for client components.
   */
  body: ReactNode;
  /** next/font classes a language adds to <html> when Satoshi lacks its letters (components/fonts/index.ts). */
  fontClassName?: string;
};

/**
 * The <html> document of one language. English has its root layout (app/(en)/layout.tsx) and every other language
 * shares app/(intl)/[lang]/layout.tsx, which reads the language from the URL, so <html lang> is right on the server for
 * every page, without middleware (the IPFS build is a static export). Moving between languages must stay a full page
 * load: two prefixed languages share one root layout, so a client navigation between them would keep the document
 * and remount the providers (components/ui/LanguageSwitch.tsx uses plain links for that reason).
 * A plain function, not a component, so a layout returns the <html> element itself.
 */
export const rootDocument = ({ locale, body, fontClassName }: RootDocumentProps) => (
  <html
    lang={LOCALE_INFO[locale].htmlLang}
    suppressHydrationWarning
    className={[satoshi.variable, satoshiItalic.variable, geistMono.variable, fontClassName].filter(Boolean).join(" ")}
  >
    <body>{body}</body>
  </html>
);
