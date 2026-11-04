import { Manrope } from "next/font/google";

// Satoshi has no Cyrillic or Greek letters. Russian, Ukrainian, Bulgarian and Greek sentences carry Latin words (Aave,
// Morpho, Telegram), and Satoshi's Latin next to another face's Cyrillic or Greek, whose letters share shapes with it
// (а and a, ο and o), would read as two typefaces in one line. So those pages set every word in Manrope (SIL Open Font
// License), a variable geometric sans close to Satoshi with Latin, Cyrillic and Greek. Those languages' <html> gets its
// class (components/fonts/index.ts); styles/globals.css points the site's text font at it under html:lang(ru),
// html:lang(uk), html:lang(bg) and html:lang(el), so no other language downloads it.
//
// Manrope has no italic. Emphasis on those pages is the browser's slanted copy of the upright face (font-synthesis is
// on by default), which reads as italic at text sizes.

/**
 * One variable file per subset, each fetched only where a page uses it. Not preloaded: every prefixed language shares
 * one root layout, so a preload would reach every language's pages. The inlined CSS declares the face in <head>, so
 * the fetch still starts with the first layout.
 */
export const cyrillicGreekFont = Manrope({
  subsets: ["latin", "cyrillic", "greek"],
  variable: "--font-cyrillic-greek",
  preload: false,
  display: "swap",
});

/** The classes the Russian, Ukrainian, Bulgarian and Greek pages add to <html>. */
export const CYRILLIC_GREEK_FONT_CLASSES = cyrillicGreekFont.variable;
