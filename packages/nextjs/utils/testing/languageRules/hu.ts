import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Oktatási tartalom, nem pénzügyi tanácsadás. A riasztások csökkentik a kockázatot, de nem akadályozzák meg a likvidálást.";

const MONTHS = "január|február|március|április|május|június|július|augusztus|szeptember|október|november|december";

// "(megtekintve: 2026. október 29.)": the year, the month in lower case, the day, each as Hungarian writes them.
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])megtekintve:? \d{4}\. (?:${MONTHS}) \d{1,2}\.`, "u");

const FREE_WORDS = /(?<!\p{L})(?:ingyen(?:es(?:en)?)?|díjmentes(?:en)?|térítésmentes(?:en)?)(?!\p{L})/iu;

// Hungarian copy that must not appear, on top of the English list. The English list's claims, in Hungarian.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /soha(?:sem)? (?:nem )?(?:likvidál|fogn?ak likvidál)/iu, reason: "guarantee: 'soha nem likvidálnak'" },
  {
    pattern: /soha(?:sem)? (?:nem )?(?:maradsz le|maradhatsz le|mulasztod el)/iu,
    reason: "guarantee: 'soha nem maradsz le'",
  },
  { pattern: /valós idej/iu, reason: "'valós idejű' (alerts are checked every 5 minutes)" },
  {
    pattern: /azonnali (?:riasztás|értesítés|üzenet)/iu,
    reason: "'azonnali riasztás' (alerts are checked every 5 minutes)",
  },
  { pattern: /multi[- ]?protokoll/iu, reason: "'multi-protokoll' (name the protocols: Aave and Morpho)" },
  {
    pattern: /close factor(?:-?[a-záéíóöőúüű]+)? (?:mindig |fixen )?(?:50 ?%|0,5(?!\d)|a fele)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  {
    pattern: /(?<![\p{L}\d.,])3(?:,0+)? ?USDC(?!\p{L})/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: /USDC (?:\/|per|minden) ?30 nap/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  // The Hungarian "free"; "nem kell fizetned" and "fizetés nélkül" are fine.
  {
    pattern: FREE_WORDS,
    reason: "'ingyenes' must not appear: write 'nem kell fizetned' or 'fizetés nélkül'",
  },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Források",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "megtekintve: <yyyy. hónap d.>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
