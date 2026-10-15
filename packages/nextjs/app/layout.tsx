import type { ReactNode } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import "@scaffold-ui/components/styles.css";
import type { Viewport } from "next";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { JsonLd } from "~~/components/seo/JsonLd";
import "~~/styles/globals.css";
import { rootMetadata, siteJsonLd } from "~~/utils/seo";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  // The browser chrome matches the root page background: --color-base-200 of each theme in styles/globals.css.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f8ff" },
    { media: "(prefers-color-scheme: dark)", color: "#2a3655" },
  ],
};

export const metadata = rootMetadata();

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <JsonLd data={siteJsonLd()} />
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
