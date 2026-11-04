import { Noto_Sans_Thai } from "next/font/google";

// Satoshi has no Thai script. Thai words never mix with Latin letters inside a word, and the two scripts share no
// letter shapes, so the Thai pages keep Satoshi for Latin letters and digits (Aave, 1.05) and draw the Thai script in
// Noto Sans Thai (SIL Open Font License), as the Hindi pages do with Devanagari. Once Thai is in LOCALES, its <html>
// gets this class (components/fonts/index.ts); styles/globals.css puts it after Satoshi under html:lang(th) and
// loosens the line height for the vowels and tone marks Thai stacks above and below its letters.
//
// Noto Sans Thai has no italic: Thai emphasis is the browser's slanted copy of the upright face, and Latin words in
// emphasis keep Satoshi's real italic.

/** Only the Thai subset: Latin comes from Satoshi. Not preloaded, like every language's own face (fonts/index.ts). */
export const thaiFont = Noto_Sans_Thai({
  subsets: ["thai"],
  variable: "--font-thai",
  preload: false,
  display: "swap",
  // The metric-matched fallback is Arial, which would take Latin letters from Satoshi's own fallback while the fonts
  // load. Without it the variable names Noto Sans Thai alone, and globals.css lists Satoshi's fallback after it.
  adjustFontFallback: false,
});

/** The classes the Thai pages add to <html>. */
export const THAI_FONT_CLASSES = thaiFont.variable;
