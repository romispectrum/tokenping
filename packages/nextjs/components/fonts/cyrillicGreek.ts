import { Manrope } from "next/font/google";

// Satoshi has no Cyrillic or Greek letters. Russian, Ukrainian, Bulgarian and Greek sentences carry Latin words (Aave,
// Morpho, Telegram), and Satoshi's Latin next to another face's Cyrillic or Greek, whose letters share shapes with it
// (а and a, ο and o), would read as two typefaces in one line. So those pages set every word in Manrope (SIL Open Font
// License), a variable geometric sans close to Satoshi with Latin, Cyrillic and Greek. Imported only by those
// languages' root layouts (LAYOUT_FONTS in scripts/localeRoutes.ts); styles/globals.css points the site's text font at
// it under html:lang(ru), html:lang(uk), html:lang(bg) and html:lang(el).
//
// Manrope has no italic. Emphasis on those pages is the browser's slanted copy of the upright face (font-synthesis is
// on by default), which reads as italic at text sizes.

/**
 * One variable file per subset. Latin, Cyrillic and Greek are preloaded, since a page shows Latin product names next
 * to its own script and the four languages share this one face. The other subsets load only where a page uses them.
 */
export const cyrillicGreekFont = Manrope({
  subsets: ["latin", "cyrillic", "greek"],
  variable: "--font-cyrillic-greek",
  display: "swap",
});

/** The classes the Russian, Ukrainian, Bulgarian and Greek root layouts add to <html>. */
export const CYRILLIC_GREEK_FONT_CLASSES = cyrillicGreekFont.variable;
