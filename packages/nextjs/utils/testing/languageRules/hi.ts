import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER = "शैक्षिक सामग्री, वित्तीय सलाह नहीं। अलर्ट जोखिम कम करते हैं, लिक्विडेशन रोकते नहीं।";

const MONTHS =
  "जनवरी|फ़रवरी|फरवरी|मार्च|अप्रैल|मई|जून|जुलाई|अगस्त|सितंबर|सितम्बर|अक्टूबर|अक्तूबर|नवंबर|नवम्बर|दिसंबर|दिसम्बर";

// "(29 अक्टूबर 2026 को देखा गया)": the day, the month, the year, then "seen on".
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])\d{1,2} (?:${MONTHS}) \d{4} को देखा गया`, "u");

// Hindi copy that must not appear, on top of the English list. The English list's claims, in Hindi word forms.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /कभी (?:भी )?लिक्विडेट नहीं (?:होंगे|होगा|होगी|होंगी)/u, reason: "guarantee: 'कभी लिक्विडेट नहीं होंगे'" },
  { pattern: /कभी (?:भी )?(?:नहीं चूकेंगे|न चूकें|मिस नहीं)/u, reason: "guarantee: 'कभी नहीं चूकेंगे'" },
  { pattern: /री?यल[- ]?टाइम|वास्तविक समय/u, reason: "'रियल-टाइम' (alerts are checked every 5 minutes)" },
  {
    pattern: /(?:तुरंत|तत्काल|इंस्टेंट) (?:अलर्ट|सूचना|संदेश|चेतावनी)/u,
    reason: "'तुरंत अलर्ट' (alerts are checked every 5 minutes)",
  },
  { pattern: /मल्टी[- ]?प्रोटोकॉल/u, reason: "'मल्टी-प्रोटोकॉल' (name the protocols: Aave and Morpho)" },
  {
    pattern: /(?:close factor|क्लोज़? फ़?ैक्टर) (?:हमेशा |तय |फ़िक्स्ड )?(?:50 ?%|0\.5\b|आधा) (?:है|होता है)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  { pattern: /\bUSDC (?:प्रति|हर) 30 दिन/u, reason: "hard-coded alert plan: use <AlertPrice />" },
  // The Hindi forms of "free"; "कोई शुल्क नहीं" and "भुगतान की ज़रूरत नहीं" are fine.
  {
    // "फ़्री" alone, not "फ़्रीज़" (freeze): \b knows no Devanagari, so a lookahead ends the word.
    pattern: /मुफ़?्त|फ़?्री(?![\p{L}\p{M}])|निः?शुल्क|नि:शुल्क/u,
    reason: "'मुफ़्त' must not appear: write 'भुगतान की ज़रूरत नहीं', 'कोई शुल्क नहीं' or 'बिना भुगतान के'",
  },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "स्रोत",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "<d माह yyyy> को देखा गया",
  freeWords: /मुफ़?्त|फ़?्री(?![\p{L}\p{M}])|निः?शुल्क|नि:शुल्क/u,
  bannedPatterns: BANNED_PATTERNS,
};
