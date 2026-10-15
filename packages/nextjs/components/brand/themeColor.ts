/**
 * The page background of each theme (--background in :root and .dark of styles/globals.css; layout.test.tsx keeps
 * them in sync), for the browser UI colour: viewport.themeColor and ThemeProvider's theme-color sync. The browser
 * cannot read CSS variables there, so these are the only hex copies.
 */
// lint-brand-ignore-next-line hex-colour: the browser UI colour cannot read CSS variables (see above)
export const THEME_COLOR = { light: "#FFFFFF", dark: "#18001C" } as const;
