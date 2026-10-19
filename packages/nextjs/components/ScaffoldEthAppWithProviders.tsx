"use client";

import { useEffect, useState } from "react";
import { RainbowKitProvider, type Theme, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { BetaBanner, SkipLink } from "~~/components/BetaBanner";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { useSignOutOnDisconnect } from "~~/hooks/custom/useWalletSession";
import { SignInRequiredError } from "~~/services/api/apiClient";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

/**
 * The page frame. The skip link comes first, the first tab stop on every page; it targets <main id="main">, which
 * takes focus programmatically only (tabIndex -1, no outline) and clears the sticky 64px header when the browser
 * scrolls to it. The header is the first thing on screen; the beta tab is fixed to the right edge and comes after the
 * main content in the tab order.
 */
export const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="flex flex-col min-h-screen min-h-[100dvh] overflow-x-hidden">
        <SkipLink />
        <Header />
        <main
          id="main"
          tabIndex={-1}
          className="relative flex flex-col flex-1 w-full min-w-0 outline-none scroll-mt-16"
        >
          {children}
        </main>
        <BetaBanner />
        <Footer />
      </div>
      <Toaster />
    </>
  );
};

// RainbowKit's modals in the Tokenping identity. Every value is a token, so the same overrides follow the light and
// the dark theme: control and card radii, Satoshi, and surfaces from the semantic tokens (RainbowKit's own dark grey
// is not a brand colour).
// The accent is the interaction colour, not pink: RainbowKit paints the selected wallet row with it and uses it as
// text on the modal surface ("Recent", "Installed", the help links, secondary buttons). Selected is never pink, and
// pink text on the white modal is 2.82:1. --link with the page colour on top is violet and white on light (6.30:1)
// and cyan and night on dark (15.33:1).
const RAINBOWKIT_THEME_OPTIONS = {
  accentColor: "var(--link)",
  accentColorForeground: "var(--background)",
  borderRadius: "medium",
} as const;

const brandRainbowKitTheme = (isDarkMode: boolean): Theme => {
  const base = isDarkMode ? darkTheme(RAINBOWKIT_THEME_OPTIONS) : lightTheme(RAINBOWKIT_THEME_OPTIONS);
  return {
    ...base,
    fonts: { body: "var(--font-satoshi), ui-sans-serif, system-ui, sans-serif" },
    radii: {
      ...base.radii,
      actionButton: "var(--radius-field)",
      connectButton: "var(--radius-field)",
      menuButton: "var(--radius-field)",
      modal: "var(--radius-box)",
      modalMobile: "var(--radius-box)",
    },
    colors: {
      ...base.colors,
      closeButton: "var(--muted-foreground)",
      closeButtonBackground: "var(--secondary)",
      connectButtonBackground: "var(--background)",
      connectButtonText: "var(--foreground)",
      generalBorder: "var(--border-color)",
      menuItemBackground: "var(--accent)",
      // the dialog scrim: night at 40% on light, 70% on dark, never black
      modalBackdrop: `color-mix(in oklab, var(--brand-night) ${isDarkMode ? 70 : 40}%, transparent)`,
      modalBackground: "var(--popover)",
      modalBorder: "var(--border-color)",
      modalText: "var(--popover-foreground)",
      modalTextSecondary: "var(--muted-foreground)",
      profileForeground: "var(--card)",
    },
  };
};

/** react-query's three retries, except after a 401 from the alert API: only signing in again helps then. */
export const retryUnlessSignedOut = (failureCount: number, error: Error) =>
  !(error instanceof SignInRequiredError) && failureCount < 3;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: retryUnlessSignedOut,
    },
  },
});

/** Ends the alert settings' session when the wallet disconnects. Needs the wagmi and react-query providers above it. */
const SignOutOnDisconnect = () => {
  useSignOutOnDisconnect();
  return null;
};

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ProgressBar height="3px" color="var(--link)" />
        <SignOutOnDisconnect />
        <RainbowKitProvider avatar={BlockieAvatar} theme={brandRainbowKitTheme(mounted && isDarkMode)}>
          <ScaffoldEthApp>{children}</ScaffoldEthApp>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
