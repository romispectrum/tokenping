/* eslint-disable @next/next/no-img-element -- next/og renders plain <img>; next/image does not exist there */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { LOGO_VIEWBOX } from "~~/components/brand/logoArt";
import { logoSvg, svgDataUri, viewBoxAspect } from "~~/components/seo/brandMark";
import { DEFAULT_LOCALE, type Locale } from "~~/i18n/locales";
import { SITE_NAME, SITE_URL } from "~~/utils/seo";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

// ImageResponse takes no CSS variables, so the token values are written out here: the night background, white
// text, the dark muted text, and the one pink accent bar.
// lint-brand-ignore-next-line hex-colour: ImageResponse cannot read CSS variables
const OG_COLORS = { background: "#18001C", text: "#FFFFFF", muted: "#CBBFC6", accent: "#FE5FA9" } as const;

// The lockup with a white wordmark, for the night surface. Sized by height like everywhere else.
const LOGO_HEIGHT = 64;
const LOGO_WIDTH = Math.round(LOGO_HEIGHT * viewBoxAspect(LOGO_VIEWBOX.primary));
const LOGO_SRC = svgDataUri(logoSvg({ variant: "primary", color: OG_COLORS.text }));

type OgFont = { name: string; file: string; weight: 400 | 500 };

/**
 * Satoshi Medium (titles) and Regular (the footer line) as OTF: ImageResponse cannot read the woff2 web fonts.
 * Satoshi has no Devanagari glyphs, so Noto Sans Devanagari (WOFF, SIL Open Font License, app/fonts/og) follows it
 * in the font list and in the card's font-family: Satori draws each glyph with the first listed font that has it, so
 * the Hindi cards get Devanagari titles and keep Satoshi for Latin letters and digits. The routes run in Node, from
 * the package root.
 */
const SATOSHI_OG_FONTS: readonly OgFont[] = [
  { name: "Satoshi", file: "Satoshi-Medium.otf", weight: 500 },
  { name: "Satoshi", file: "Satoshi-Regular.otf", weight: 400 },
];

const OG_FONTS: readonly OgFont[] = [
  ...SATOSHI_OG_FONTS,
  { name: "Noto Sans Devanagari", file: "NotoSansDevanagari-Medium.woff", weight: 500 },
  { name: "Noto Sans Devanagari", file: "NotoSansDevanagari-Regular.woff", weight: 400 },
];

/**
 * A family whose Fontsource files come split by subset (app/fonts/og/<prefix>-<subset>-<weight>.woff), Medium then
 * Regular. Satori finds each glyph in whichever file of the family has it.
 */
const subsetFonts = (name: string, prefix: string, subsets: readonly string[]): OgFont[] =>
  ([500, 400] as const).flatMap(weight =>
    subsets.map(subset => ({ name, file: `${prefix}-${subset}-${weight}.woff`, weight })),
  );

/** A card's font files and the font-family that names them, first choice first. */
type OgType = { family: string; fonts: readonly OgFont[] };

const DEFAULT_OG_TYPE: OgType = { family: "Satoshi, Noto Sans Devanagari", fonts: OG_FONTS };

const MANROPE_FAMILY = "Manrope";

const CYRILLIC_OG_TYPE: OgType = {
  family: MANROPE_FAMILY,
  fonts: subsetFonts(MANROPE_FAMILY, "Manrope", ["latin", "cyrillic"]),
};

/**
 * The cards whose script Satoshi lacks, by language code. Plain codes, not `Locale`, so languages that are not in
 * LOCALES yet are already here, and adding one there gives its cards their fonts. Each card reads only its own files.
 *
 * - Vietnamese: Satoshi lacks most Vietnamese letters, and a per-letter fallback would mix two typefaces inside one
 *   word, so the cards are drawn in Plus Jakarta Sans alone, the font of the Vietnamese pages (components/fonts).
 * - Russian, Ukrainian, Bulgarian and Greek: Cyrillic and Greek letters share shapes with Latin, so the cards are drawn
 *   in Manrope alone, the font of those pages, with the Latin subset and the language's own script.
 * - Thai shares no letters with Latin: the cards keep Satoshi and add Noto Sans Thai for the Thai script, as the Hindi
 *   cards do with Devanagari. Satori does not lift a tone mark above an upper vowel (no mark-to-mark positioning, with
 *   every Thai font tried), so ที่ draws as ที and กิ่ like กี: check the Thai cards' titles when Thai is added.
 */
const OG_TYPES: Partial<Record<string, OgType>> = {
  vi: {
    family: "Plus Jakarta Sans",
    fonts: subsetFonts("Plus Jakarta Sans", "PlusJakartaSans", ["latin", "latin-ext", "vietnamese"]),
  },
  ru: CYRILLIC_OG_TYPE,
  uk: CYRILLIC_OG_TYPE,
  bg: CYRILLIC_OG_TYPE,
  el: { family: MANROPE_FAMILY, fonts: subsetFonts(MANROPE_FAMILY, "Manrope", ["latin", "greek"]) },
  th: {
    family: "Satoshi, Noto Sans Thai",
    fonts: [...SATOSHI_OG_FONTS, ...subsetFonts("Noto Sans Thai", "NotoSansThai", ["thai"])],
  },
};

/** The fonts of a card in the language `code`: Satoshi and Noto Sans Devanagari unless its script needs others. */
export const ogType = (code: string): OgType => OG_TYPES[code] ?? DEFAULT_OG_TYPE;

/**
 * next/og sends its cards as "public, immutable, max-age=31536000", which promises the bytes at that URL never change.
 * The cards' URLs carry no hash, and a card does change (a new title, the site card's wording), so caches may keep one
 * a day, then check again. The site card's URL also takes a version (utils/seo.ts) when it is redesigned.
 */
export const OG_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

/** The ImageResponse options of a card in `locale`: its size, cache header and fonts. */
export const ogImageOptions = async (locale: Locale = DEFAULT_LOCALE) => ({
  ...OG_IMAGE_SIZE,
  headers: { "Cache-Control": OG_CACHE_CONTROL },
  fonts: await loadOgFonts(locale),
});

/** Reads the font files of a card in the language `code`, only when a card is drawn. */
export const loadOgFonts = (code: string) =>
  Promise.all(
    ogType(code).fonts.map(async ({ name, file, weight }) => ({
      name,
      data: await readFile(join(process.cwd(), "app/fonts/og", file)),
      weight,
      style: "normal" as const,
    })),
  );

type OgCardProps = {
  title: string;
  /** The card's language, which picks its font. English when absent. */
  locale?: Locale;
  /** The line under the accent bar, e.g. "Tokenping · Aave V3 guides". */
  footer: string;
};

// 72px for short titles, down to 56px so a long title still fits in about two lines inside the 80px safe area.
const titleFontSize = (title: string) => (title.length <= 40 ? 72 : title.length <= 60 ? 64 : 56);

/**
 * The 1200x630 social card shared by the site card and the per-post cards: the lockup on the night colour, the
 * title in Satoshi Medium, one short pink bar as the only accent. Flat: no glow, grain or background gradient.
 * Satori lays out a flexbox subset only, so every element with more than one child sets display: flex.
 */
export const OgCard = ({ title, footer, locale = DEFAULT_LOCALE }: OgCardProps) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: 80,
      background: OG_COLORS.background,
      color: OG_COLORS.text,
      // lint-brand-ignore-next-line font-family: the names ImageResponse registers the font files under
      fontFamily: ogType(locale).family,
    }}
  >
    <img src={LOGO_SRC} width={LOGO_WIDTH} height={LOGO_HEIGHT} alt={SITE_NAME} />
    <div
      style={{
        display: "flex",
        fontSize: titleFontSize(title),
        fontWeight: 500,
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        maxWidth: 1040,
      }}
    >
      {title}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", width: 160, height: 6, borderRadius: 999, background: OG_COLORS.accent }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 28,
          fontWeight: 400,
          color: OG_COLORS.muted,
        }}
      >
        <div style={{ display: "flex" }}>{footer}</div>
        <div style={{ display: "flex" }}>{new URL(SITE_URL).host}</div>
      </div>
    </div>
  </div>
);
