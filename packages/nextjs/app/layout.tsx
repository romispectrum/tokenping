import type { ReactNode } from "react";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "@rainbow-me/rainbowkit/styles.css";
import "@scaffold-ui/components/styles.css";
import type { Viewport } from "next";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { THEME_COLOR } from "~~/components/brand/themeColor";
import { JsonLd } from "~~/components/seo/JsonLd";
import "~~/styles/globals.css";
import { rootMetadata, siteJsonLd } from "~~/utils/seo";

// Satoshi, the only typeface for words. The variable font's real weight axis is 300 to 900. The italic stays in this
// family although it is preloaded with the upright face: in a separate localFont it would be another family, and italic
// text (MDX emphasis, the blog disclaimers) would get a slanted copy of the upright face instead.
const satoshi = localFont({
  src: [
    { path: "./fonts/Satoshi-Variable.woff2", weight: "300 900", style: "normal" },
    { path: "./fonts/Satoshi-VariableItalic.woff2", weight: "300 900", style: "italic" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

// Data only: addresses, hashes, tx ids and digit-compared numbers (the font-data utility). Not preloaded: most
// pages show no data, and a preload would compete with the hero text for bandwidth.
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  // One static value: the app is light by default whatever the OS says. ThemeProvider switches it with the theme.
  themeColor: THEME_COLOR.light,
  colorScheme: "light dark",
};

export const metadata = rootMetadata();

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning className={`${satoshi.variable} ${geistMono.variable}`}>
      <body>
        <JsonLd data={siteJsonLd()} />
        <ThemeProvider attribute={["class", "data-theme"]} defaultTheme="light" enableSystem disableTransitionOnChange>
          <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
