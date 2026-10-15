"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps, useTheme } from "next-themes";
import { THEME_COLOR } from "~~/components/brand/themeColor";

/**
 * Keeps the browser bar in step with the page. The layout ships a static viewport.themeColor of the light
 * background (the app is light by default whatever the OS says); this rewrites every theme-color meta to the
 * resolved theme's background, and watches <head> because Next re-renders that meta on client navigation.
 */
const ThemeColorSync = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    const color = resolvedTheme === "dark" ? THEME_COLOR.dark : THEME_COLOR.light;
    const apply = () => {
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta => {
        if (meta.content !== color) meta.content = color;
        if (meta.media) meta.removeAttribute("media");
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["content", "media"],
    });
    return () => observer.disconnect();
  }, [resolvedTheme]);

  return null;
};

/** next-themes with the theme-colour sync. The root layout passes the settings. */
export const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => (
  <NextThemesProvider {...props}>
    <ThemeColorSync />
    {children}
  </NextThemesProvider>
);
