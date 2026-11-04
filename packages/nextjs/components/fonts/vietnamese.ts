import { Plus_Jakarta_Sans } from "next/font/google";

// Satoshi lacks most Vietnamese letters (ơ, ư and the stacked tone marks), and a per-letter fallback would mix two
// typefaces inside one word. The Vietnamese pages set every word in Plus Jakarta Sans (SIL Open Font License), a
// variable geometric sans with full Vietnamese support, instead. The Vietnamese <html> gets its class
// (components/fonts/index.ts); styles/globals.css points the site's text font at it under html:lang(vi), so only the
// Vietnamese pages download it.

/** The upright face: one variable file per subset, not preloaded (fonts/index.ts). */
export const vietnameseFont = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  style: "normal",
  variable: "--font-vietnamese",
  preload: false,
  display: "swap",
});

/** The italic face (MDX emphasis, the blog disclaimers), fetched only where italic text is shown. */
export const vietnameseItalicFont = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  style: "italic",
  variable: "--font-vietnamese-italic",
  display: "swap",
  preload: false,
});

/** The classes the Vietnamese pages add to <html>. */
export const VIETNAMESE_FONT_CLASSES = `${vietnameseFont.variable} ${vietnameseItalicFont.variable}`;
