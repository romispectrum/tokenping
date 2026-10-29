import { evaluate } from "@mdx-js/mdx";
import { readFileSync, readdirSync } from "node:fs";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";
import { CALLOUT_TONES } from "~~/components/blog/Callout";
import { headingId } from "~~/components/blog/headingId";
import { CHILDLESS_COMPONENTS, MDX_VOCABULARY_NAMES, SINGLE_POST_COMPONENTS } from "~~/components/blog/vocabulary";
import type { PostMeta } from "~~/content/blog/types";
import { LOCALES, type Locale } from "~~/i18n/locales";
import { POST_SLUGS, postKeyForSlug } from "~~/i18n/postSlugs";
import { localeFromPath, postPath, routePath } from "~~/i18n/routes";

// Content lint for every post, content/blog/*.mdx (English), content/blog/cs/*.mdx (Czech) and content/blog/es/*.mdx
// (Spanish): the article contract from the blog build spec, checked on the parsed MDX tree (after remark-gfm) rather
// than on raw text, so code, URLs and JSX attributes cannot cause false positives. Every language gets the same checks;
// what differs (the disclaimer, the Sources heading and date wording, the pages a post may link to, the banned
// phrases) is in LANGUAGE_RULES.
// Placeholder posts (`stub: true` in meta) get the meta checks and are reported as pending for the rest.

const BLOG_DIR = new URL("./", import.meta.url);

const ARTICLE_DISCLAIMER =
  "Educational content, not financial advice. Alerts reduce risk; they do not prevent liquidation.";
const CS_ARTICLE_DISCLAIMER =
  "Vzdělávací obsah, nikoli finanční poradenství. Upozornění snižují riziko, likvidaci ale nezabrání.";
const ES_ARTICLE_DISCLAIMER =
  "Contenido educativo, no asesoramiento financiero. Las alertas reducen el riesgo, pero no evitan la liquidación.";
const HI_ARTICLE_DISCLAIMER = "शैक्षिक सामग्री, वित्तीय सलाह नहीं। अलर्ट जोखिम कम करते हैं, लिक्विडेशन रोकते नहीं।";
const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 155;
const MIN_DESCRIPTION_LENGTH = 50;
const MAX_HEADLINE_LENGTH = 110; // BlogPosting.headline is built from h1
const WORDS_PER_MINUTE = 230;
const MAX_STUB_WORDS = 60;
const META_KEYS = new Set<string>([
  "slug",
  "title",
  "description",
  "h1",
  "publishedAt",
  "updatedAt",
  "primaryQuestion",
  "readingMinutes",
  "stub",
  "protocol",
]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const FETCHED_DATE = /\bfetched (?:on )?\d{1,2} (?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}\b/i;
const CS_MONTHS = "ledna|února|března|dubna|května|června|července|srpna|září|října|listopadu|prosince";
const CS_FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])načteno (?:dne )?\d{1,2}\. (?:${CS_MONTHS}) \d{4}(?!\d)`, "i");
const ES_MONTHS = "enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre";
const ES_FETCHED_DATE = new RegExp(
  String.raw`(?:^|[\s(])consultad[oa] el \d{1,2} de (?:${ES_MONTHS}) de \d{4}(?!\d)`,
  "i",
);
const HI_MONTHS =
  "जनवरी|फ़रवरी|फरवरी|मार्च|अप्रैल|मई|जून|जुलाई|अगस्त|सितंबर|सितम्बर|अक्टूबर|अक्तूबर|नवंबर|नवम्बर|दिसंबर|दिसम्बर";
// "(29 अक्टूबर 2026 को देखा गया)": the day, the month, the year, then "seen on".
const HI_FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])\d{1,2} (?:${HI_MONTHS}) \d{4} को देखा गया`, "u");
const SITE_HOST = /^https?:\/\/(?:www\.)?tokenping\.xyz(?:[/?#]|$)/i;

type BannedPattern = {
  pattern: RegExp;
  reason: string;
  /** Stale claims may be quoted to correct them ('aave.com still says "close factor is 0.5"'); claims about us not. */
  allowQuoted?: boolean;
};

// Copy that must not appear, and stale Aave claims.
// Each pattern targets the claim, not the topic: "Isolation Mode was removed in V3.7" and "the close factor is no
// longer a flat 50%" pass.
const NOT_CORRECTED = String.raw`(?! (?:no longer|not|gone|removed|deprecated|replaced|retired))`;
const NOT_NEGATED = String.raw`(?<!(?:no longer|not|never|n't) )`;
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /\bnever (?:get|be|getting|being) liquidated\b/i, reason: "guarantee: 'never get liquidated'" },
  { pattern: /\bnever miss(?:es|ed)?\b/i, reason: "guarantee: 'never miss'" },
  { pattern: /\breal[- ]time\b/i, reason: "'real-time' (alerts are checked every 5 minutes)" },
  { pattern: /\binstant(?:ly|aneous|aneously)?\b/i, reason: "'instant' (alerts are checked every 5 minutes)" },
  { pattern: /\bmulti[- ]?protocol\b/i, reason: "'multi-protocol' (name the protocols: Aave and Morpho)" },
  { pattern: /\bopen[- ]source[- ]licen[cs]ed\b/i, reason: "'open-source licensed' (the repo has no LICENSE)" },
  { pattern: /\bsecure settings\b/i, reason: "'secure settings' (Tokenping's operators and hosts can read them)" },
  {
    pattern: /\bonly you can see\b/i,
    reason: "'only you can see' (Tokenping's operators and hosts can read settings)",
  },
  {
    pattern: /\balerts? (?:keeps?|continues?) (?:running|working|firing|coming) after\b/i,
    reason: "'alerts keep running after your subscription ends' must not be marketed",
  },
  {
    pattern: new RegExp(
      String.raw`\bisolation mode (?:is|lets|allows|limits|caps|restricts|requires)\b${NOT_CORRECTED}`,
      "i",
    ),
    reason: "stale: Isolation Mode was removed in Aave V3.7",
    allowQuoted: true,
  },
  {
    pattern: new RegExp(
      String.raw`\bsiloed borrowing (?:is|lets|allows|limits|restricts|requires)\b${NOT_CORRECTED}`,
      "i",
    ),
    reason: "stale: Siloed Borrowing was removed in Aave V3.7",
    allowQuoted: true,
  },
  {
    pattern:
      /\bclose factor (?:is|=) (?:always |fixed at |a flat |a fixed )?(?:50 ?%|0\.5\b|half\b)(?! (?:only|when|if|unless|while|as long as))/i,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  {
    pattern: new RegExp(
      String.raw`\bdebt ceilings? (?:is|are|lets|allows?|limits?|caps?|restricts?|requires?|appl(?:y|ies)|of)\b${NOT_CORRECTED}`,
      "i",
    ),
    reason: "stale: debt ceilings were removed with Isolation Mode in Aave V3.7",
    allowQuoted: true,
  },
  {
    pattern: new RegExp(
      String.raw`${NOT_NEGATED}\b(?:has|have|is subject to|are subject to) (?:an? |the |its |their )?debt ceilings?\b`,
      "i",
    ),
    reason: "stale: debt ceilings were removed with Isolation Mode in Aave V3.7",
    allowQuoted: true,
  },
  {
    pattern:
      /\bliquidations? (?:(?:can|may|will) )?(?:(?:is|are|be|get|gets) )?(?:paused?|pauses|blocked|halted|halts?|stopped|stops|disabled|frozen) (?:while|when|whenever|if|during|until)\b[^.]{0,40}\bsequencer\b/i,
    reason: "stale: since Aave V3.7, L2 sequencer downtime no longer pauses liquidations",
    allowQuoted: true,
  },
  {
    pattern: new RegExp(
      String.raw`\b(?:sequencer|price ?oracle ?sentinel)\b[^.]{0,60}${NOT_NEGATED}\b(?:pauses|blocks|halts|stops|freezes|disables|delays) (?:all |new )?liquidations\b`,
      "i",
    ),
    reason: "stale: since Aave V3.7, L2 sequencer downtime no longer pauses liquidations",
    allowQuoted: true,
  },
  {
    pattern: /\b(?:HF|health factor)(?: is)? ?(?:<|below|under|less than|falls below|drops below) ?0\.95\b/i,
    reason: "the 100% close factor applies at HF ≤ 0.95 in the code, not '< 0.95': write 'at or below 0.95'",
    allowQuoted: true,
  },
  { pattern: /bgd-labs\/aave-capo/i, reason: "stale: the bgd-labs/aave-capo path moved", allowQuoted: true },
  // Tokenping sends alerts on Signal, Telegram and email, so articles may name all three. The plan's bracketed
  // placeholder from the time Telegram was not live yet must still not ship.
  {
    pattern: /\[(?:or |and |plus |\+ ?)?Telegram\b[^\]]*\]/i,
    reason: "the plan's [Telegram variant] placeholder must not ship: write the channels out",
  },
  {
    pattern: /(?<![\d.,])\$?3(?:\.0+)? ?USDC\b/i,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: /\bUSDC (?:per|for|every|\/) ?30 days\b/i, reason: "hard-coded alert plan: use <AlertPrice />" },
  // Owner's rule: "free" never appears in published content. Say what is paid; for other tools "costs nothing" or
  // "at no charge"; for Tokenping's dashboard only "needs no payment".
  {
    pattern: /\bfree\b/i,
    reason: "'free' must not appear: say what is paid, 'costs nothing', 'at no charge' or 'needs no payment'",
  },
  { pattern: /\bfreemium\b/i, reason: "'freemium' must not appear: write 'a no-cost tier plus paid plans'" },
];

type MdAttribute = { type: string; name?: string; value?: unknown };

type MdNode = {
  type: string;
  depth?: number;
  url?: string;
  value?: string;
  name?: string | null;
  attributes?: MdAttribute[];
  children?: MdNode[];
  /** ESM and expression nodes carry their parsed program. */
  data?: { estree?: { body?: { type: string }[] } };
};

const BLOCK_TYPES = new Set([
  "root",
  "paragraph",
  "heading",
  "list",
  "listItem",
  "table",
  "tableRow",
  "tableCell",
  "blockquote",
  "mdxJsxFlowElement",
  "thematicBreak",
]);
const SILENT_TYPES = new Set(["code", "mdxjsEsm", "mdxFlowExpression", "mdxTextExpression", "definition"]);

/** Visible text of a node. Inline code counts only when asked (heading ids include it; prose checks do not). */
const textOf = (node: MdNode, { code = false } = {}): string => {
  if (node.type === "text") return node.value ?? "";
  if (node.type === "inlineCode") return code ? (node.value ?? "") : " ";
  if (SILENT_TYPES.has(node.type)) return " ";
  const inner = (node.children ?? []).map(child => textOf(child, { code })).join("");
  return BLOCK_TYPES.has(node.type) ? `\n${inner}\n` : inner;
};

const squash = (text: string) => text.replace(/\s+/g, " ").trim();

const walk = (node: MdNode, visit: (node: MdNode) => void) => {
  visit(node);
  node.children?.forEach(child => walk(child, visit));
};

const collect = (node: MdNode, predicate: (node: MdNode) => boolean) => {
  const found: MdNode[] = [];
  walk(node, child => predicate(child) && found.push(child));
  return found;
};

const isJsx = (node: MdNode) => node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement";

/** `<X />` alone on a line can arrive as a paragraph around a text-level element; treat both as the element. */
const unwrapJsxParagraph = (node: MdNode) =>
  node.type === "paragraph" && node.children?.length === 1 && isJsx(node.children[0]) ? node.children[0] : node;

const isExpression = (node: MdNode) => node.type === "mdxFlowExpression" || node.type === "mdxTextExpression";

/** `{/* … *\/}`: an expression whose parsed program has comments and no statements. */
const isCommentExpression = (node: MdNode) => isExpression(node) && node.data?.estree?.body?.length === 0;

// Czech quotes („…“, ‚…‘) count as quotes too, so a stale English claim quoted in a Czech post is skipped alike.
const normalizeQuotes = (text: string) => text.replace(/[‘’‚]/g, "'").replace(/[“”„]/g, '"');
const stripQuoted = (text: string) => text.replace(/"[^"\n]*"/g, '""');

// Czech copy that must not appear, on top of the English list (Czech posts may quote English text, and product names,
// prices and Aave terms stay English). The same claims as above, in Czech word forms.
const CS_BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /\bnikdy (?:nebudete|nebude|nebudou) zlikvidován/i, reason: "guarantee: 'nikdy nebudete zlikvidováni'" },
  { pattern: /\bnikdy (?:ne)?zmešk/i, reason: "guarantee: 'nikdy nezmeškáte'" },
  { pattern: /\bv reálném čase\b/i, reason: "'v reálném čase' (alerts are checked every 5 minutes)" },
  {
    pattern: /\bokamžit\S* (?:upozorněn|zpráv|notifikac|varován)/i,
    reason: "'okamžité upozornění' (alerts are checked every 5 minutes)",
  },
  { pattern: /\bmulti[- ]?protokol/i, reason: "'multiprotokolový' (name the protocols: Aave and Morpho)" },
  {
    pattern: /\bclose factor (?:je|činí) (?:vždy |pevně |fixně |napevno )?(?:50 ?%|0[.,]5\b|polovin)/i,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  {
    pattern: /(?<![\d.,])\$?3(?:,0+)? ?USDC\b/i,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  {
    pattern: /\bUSDC (?:za|na|každých) ?30 (?:dní|dnů|dny)(?!\p{L})/iu,
    reason: "hard-coded alert plan: use <AlertPrice />",
  },
  // The Czech forms of "free"; "bez poplatku" is fine.
  {
    pattern: /\bzdarma\b/i,
    reason: "'zdarma' must not appear: write 'nic nestojí', 'bez poplatku' or 'nevyžaduje platbu'",
  },
  { pattern: /\bbezplatn/i, reason: "'bezplatný' must not appear: write 'bez poplatku' or 'nic nestojí'" },
];

// Spanish copy that must not appear, on top of the English list (Spanish posts may quote English text, and product
// names, prices and Aave terms stay English). The same claims as above, in Spanish word forms.
const ES_BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /\bnunca (?:serás|será|serán|te) liquidad/i, reason: "guarantee: 'nunca serás liquidado'" },
  { pattern: /\bnunca te (?:perderás|pierdas)\b/i, reason: "guarantee: 'nunca te perderás'" },
  { pattern: /\ben tiempo real\b/i, reason: "'en tiempo real' (alerts are checked every 5 minutes)" },
  {
    pattern: /\b(?:instantáne\S*|al instante)\b|\b(?:alertas?|avisos?|notificaci\S*|mensajes?) inmediat/i,
    reason: "'instantáneo' (alerts are checked every 5 minutes)",
  },
  { pattern: /\bmulti[- ]?protocolo/i, reason: "'multiprotocolo' (name the protocols: Aave and Morpho)" },
  {
    pattern: /\b(?:close factor|factor de cierre) (?:es|=) (?:siempre |fijo de |un |una )?(?:50 ?%|0\.5\b|la mitad)/i,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  {
    pattern: /\bUSDC (?:por|cada|para) 30 días\b/i,
    reason: "hard-coded alert plan: use <AlertPrice />",
  },
  // The Spanish forms of "free"; "sin comisión" and "no cuesta nada" are fine.
  {
    pattern: /\bgratis\b/i,
    reason: "'gratis' must not appear: write 'no cuesta nada', 'sin comisión' or 'no requiere pago'",
  },
  { pattern: /\bgratuit/i, reason: "'gratuito' must not appear: write 'sin comisión' or 'no cuesta nada'" },
];

// Hindi copy that must not appear, on top of the English list. The same claims as above, in Hindi word forms.
const HI_BANNED_PATTERNS: readonly BannedPattern[] = [
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

const findBannedPhrases = (text: string, patterns: readonly BannedPattern[] = BANNED_PATTERNS) => {
  const normalized = normalizeQuotes(text);
  return patterns.flatMap(({ pattern, reason, allowQuoted }) => {
    const match = (allowQuoted ? stripQuoted(normalized) : normalized).match(pattern);
    return match ? [`"${match[0]}": ${reason}`] : [];
  });
};

// Voice rule: no em or en dashes anywhere in a post (meta, prose, link text, comments), whether typed, written as an
// HTML entity (which MDX decodes) or written as a JavaScript unicode escape, with or without braces, in meta or a JSX
// expression. Rewrite with a colon, comma, full stop or "to"; a plain hyphen is fine in ranges like 2025-2026. Checked
// on the raw source because no part of a post may carry one. The characters and escapes are built from code points
// and parts so this file does not contain what it bans.
const EN_DASH = String.fromCodePoint(0x2013);
const EM_DASH = String.fromCodePoint(0x2014);
const DASH_PATTERN = new RegExp(
  String.raw`[${EN_DASH}${EM_DASH}]|&[mn]dash;|&#(?:821[12]|x201[34]);|\\u(?:201[34]|\{201[34]\})`,
  "gi",
);
const EN_DASH_FORMS = [EN_DASH, "ndash", "8211", "2013"];

/** Every em or en dash in a post's source, by line, with a little context so the report says what to rewrite. */
const findDashes = (source: string) =>
  source.split("\n").flatMap((line, lineIndex) =>
    [...line.matchAll(DASH_PATTERN)].map(({ 0: dash, index = 0 }) => {
      const kind = EN_DASH_FORMS.some(form => dash.toLowerCase().includes(form)) ? "en dash" : "em dash";
      const excerpt = squash(line.slice(Math.max(0, index - 30), index + dash.length + 30));
      return `line ${lineIndex + 1}: ${kind} in "${excerpt}"`;
    }),
  );

type LoadedPost = {
  slug: string;
  locale?: Locale;
  tree?: MdNode;
  meta?: PostMeta;
  error?: unknown;
};

/** Compiles and evaluates one post with remark-gfm, keeping the mdast tree for the checks below. */
const parsePost = async (source: string, slug: string, locale: Locale = "en"): Promise<LoadedPost> => {
  let tree: MdNode | undefined;
  const captureTree = () => (root: MdNode) => {
    tree = root;
  };
  try {
    const exports = await evaluate(
      { value: source, path: `${slug}.mdx` },
      { ...(runtime as unknown as Parameters<typeof evaluate>[1]), remarkPlugins: [remarkGfm, captureTree] },
    );
    return { slug, locale, tree, meta: exports.meta as PostMeta | undefined };
  } catch (error) {
    // The tree is captured before evaluation, so the checks can still explain what is wrong.
    return { slug, locale, tree, error };
  }
};

const POST_DIRS: Record<Locale, URL> = {
  en: BLOG_DIR,
  cs: new URL("./cs/", BLOG_DIR),
  es: new URL("./es/", BLOG_DIR),
  hi: new URL("./hi/", BLOG_DIR),
};

const loadLanguage = async (locale: Locale) => {
  const dir = POST_DIRS[locale];
  const files = readdirSync(dir)
    .filter(file => file.endsWith(".mdx"))
    .sort();
  const sources = new Map(
    files.map(file => [file.replace(/\.mdx$/, ""), readFileSync(new URL(file, dir), "utf8")] as const),
  );
  const posts = await Promise.all([...sources].map(([slug, source]) => parsePost(source, slug, locale)));
  return { files, sources, posts };
};

const LANGUAGES = Object.fromEntries(
  await Promise.all(LOCALES.map(async locale => [locale, await loadLanguage(locale)] as const)),
) as Record<Locale, Awaited<ReturnType<typeof loadLanguage>>>;

const headingsOf = (tree: MdNode) => collect(tree, node => node.type === "heading");
const headingIdsOf = (tree: MdNode) => headingsOf(tree).map(node => headingId(squash(textOf(node, { code: true }))));

type PostIndex = {
  /** Every post's anchors by slug; null for a placeholder, whose headings do not exist yet. */
  headingIds: Map<string, Set<string> | null>;
};

const indexPosts = (posts: readonly LoadedPost[]): PostIndex => ({
  headingIds: new Map(
    posts.map(({ slug, tree, meta }) => [slug, meta?.stub ? null : new Set(tree ? headingIdsOf(tree) : [])]),
  ),
});

const POST_INDEX: Record<Locale, PostIndex> = {
  en: indexPosts(LANGUAGES.en.posts),
  cs: indexPosts(LANGUAGES.cs.posts),
  es: indexPosts(LANGUAGES.es.posts),
  hi: indexPosts(LANGUAGES.hi.posts),
};

type LanguageRules = {
  disclaimer: string;
  sourcesHeading: string;
  fetchedDate: RegExp;
  /** How the fetched date reads, for the report. */
  fetchedFormat: string;
  bannedPatterns: readonly BannedPattern[];
};

const LANGUAGE_RULES: Record<Locale, LanguageRules> = {
  en: {
    disclaimer: ARTICLE_DISCLAIMER,
    sourcesHeading: "Sources",
    fetchedDate: FETCHED_DATE,
    fetchedFormat: "fetched <d Mon yyyy>",
    bannedPatterns: BANNED_PATTERNS,
  },
  cs: {
    disclaimer: CS_ARTICLE_DISCLAIMER,
    sourcesHeading: "Zdroje",
    fetchedDate: CS_FETCHED_DATE,
    fetchedFormat: "načteno <d. měsíce yyyy>",
    bannedPatterns: [...BANNED_PATTERNS, ...CS_BANNED_PATTERNS],
  },
  es: {
    disclaimer: ES_ARTICLE_DISCLAIMER,
    sourcesHeading: "Fuentes",
    fetchedDate: ES_FETCHED_DATE,
    fetchedFormat: "consultado el <d de mes de yyyy>",
    bannedPatterns: [...BANNED_PATTERNS, ...ES_BANNED_PATTERNS],
  },
  hi: {
    disclaimer: HI_ARTICLE_DISCLAIMER,
    sourcesHeading: "स्रोत",
    fetchedDate: HI_FETCHED_DATE,
    fetchedFormat: "<d माह yyyy> को देखा गया",
    bannedPatterns: [...BANNED_PATTERNS, ...HI_BANNED_PATTERNS],
  },
};

const checkMeta = (post: LoadedPost): string[] => {
  const { meta, slug, locale = "en" } = post;
  if (!meta || typeof meta !== "object") return ["missing `export const meta = { … }`"];
  const problems: string[] = [];
  const unknownKeys = Object.keys(meta).filter(key => !META_KEYS.has(key));
  if (unknownKeys.length) problems.push(`unknown meta keys: ${unknownKeys.join(", ")}`);
  const isNonEmpty = (value: unknown): value is string =>
    typeof value === "string" && value.trim() === value && !!value;

  if (meta.slug !== slug) problems.push(`meta.slug "${meta.slug}" must equal the file name "${slug}"`);
  if (!isNonEmpty(meta.title)) problems.push("meta.title must be a non-empty, trimmed string");
  else if (meta.title.length > MAX_TITLE_LENGTH)
    problems.push(`meta.title is ${meta.title.length} chars (max ${MAX_TITLE_LENGTH})`);
  // A placeholder has no article yet: its description may be short and it asks no question.
  const minDescriptionLength = meta.stub ? 1 : MIN_DESCRIPTION_LENGTH;
  if (!isNonEmpty(meta.description)) problems.push("meta.description must be a non-empty, trimmed string");
  else if (meta.description.length > MAX_DESCRIPTION_LENGTH || meta.description.length < minDescriptionLength)
    problems.push(
      `meta.description is ${meta.description.length} chars (${MIN_DESCRIPTION_LENGTH} to ${MAX_DESCRIPTION_LENGTH})`,
    );
  if (!isNonEmpty(meta.h1)) problems.push("meta.h1 must be a non-empty, trimmed string");
  else if (meta.h1.length > MAX_HEADLINE_LENGTH)
    problems.push(`meta.h1 is ${meta.h1.length} chars (max ${MAX_HEADLINE_LENGTH})`);
  if (!isNonEmpty(meta.primaryQuestion) || (!meta.stub && !meta.primaryQuestion.endsWith("?")))
    problems.push("meta.primaryQuestion must be a question ending in '?'");

  const isIsoDate = (value: unknown): value is string => {
    if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  };
  if (!isIsoDate(meta.publishedAt)) problems.push(`meta.publishedAt "${meta.publishedAt}" must be a YYYY-MM-DD date`);
  if (meta.updatedAt !== undefined) {
    if (!isIsoDate(meta.updatedAt)) problems.push(`meta.updatedAt "${meta.updatedAt}" must be a YYYY-MM-DD date`);
    else if (isIsoDate(meta.publishedAt) && meta.updatedAt < meta.publishedAt)
      problems.push("meta.updatedAt is before meta.publishedAt");
  }
  if (!Number.isInteger(meta.readingMinutes) || meta.readingMinutes < 1)
    problems.push("meta.readingMinutes must be a whole number of minutes, at least 1");
  if (meta.stub !== undefined && meta.stub !== true) problems.push("meta.stub must be `true` or absent");
  if (meta.protocol !== undefined && meta.protocol !== "morpho")
    problems.push('meta.protocol must be "morpho" or absent (Aave)');

  for (const field of ["title", "description", "h1", "primaryQuestion"] as const) {
    if (typeof meta[field] === "string")
      problems.push(
        ...findBannedPhrases(meta[field], LANGUAGE_RULES[locale].bannedPatterns).map(
          found => `meta.${field}: ${found}`,
        ),
      );
  }
  return problems;
};

/** Top-level body nodes, without the meta export and MDX comments. */
const bodyOf = (tree: MdNode) =>
  (tree.children ?? []).filter(node => node.type !== "mdxjsEsm" && !isCommentExpression(node)).map(unwrapJsxParagraph);

const proseOf = (tree: MdNode) => squash(textOf({ type: "root", children: bodyOf(tree) }));

const checkEsm = (tree: MdNode) => {
  const statements = (tree.children ?? [])
    .filter(node => node.type === "mdxjsEsm")
    .flatMap(node => node.data?.estree?.body ?? []);
  const first = tree.children?.[0];
  const problems: string[] = [];
  if (first?.type !== "mdxjsEsm" || !/^export const meta\s*=/.test(first.value ?? ""))
    problems.push("the first statement must be `export const meta = { … }`");
  if (statements.length !== 1)
    problems.push(`found ${statements.length} import/export statements; only the meta export is allowed`);
  return problems;
};

const checkOpening = (tree: MdNode) => {
  const [first, second] = bodyOf(tree);
  const problems: string[] = [];
  if (first?.type !== "mdxJsxFlowElement" || first.name !== "ShortAnswer")
    problems.push("the body must start with <ShortAnswer>…</ShortAnswer>");
  if (second?.type !== "mdxJsxFlowElement" || second.name !== "ScopeNote")
    problems.push("<ScopeNote /> must come right after <ShortAnswer>");
  return problems;
};

const checkJsx = (tree: MdNode, slug: string, locale: Locale = "en") => {
  const key = postKeyForSlug(locale, slug) ?? slug;
  const problems: string[] = [];
  const counts = new Map<string, number>();
  for (const node of collect(tree, isJsx)) {
    const name = node.name ?? "<>";
    counts.set(name, (counts.get(name) ?? 0) + 1);
    if (!(MDX_VOCABULARY_NAMES as readonly string[]).includes(name)) {
      problems.push(`<${name}> is not in the MDX vocabulary (${MDX_VOCABULARY_NAMES.join(", ")}); use Markdown`);
      continue;
    }
    const owner = SINGLE_POST_COMPONENTS[name as keyof typeof SINGLE_POST_COMPONENTS];
    if (owner && owner !== key) problems.push(`<${name}> belongs to ${POST_SLUGS[owner]?.[locale] ?? owner} only`);
    if ((CHILDLESS_COMPONENTS as readonly string[]).includes(name) && node.children?.length)
      problems.push(`<${name} /> takes no children`);
    if (name === "Callout") {
      const tone = node.attributes?.find(attribute => attribute.name === "tone");
      if (tone && !(CALLOUT_TONES as readonly unknown[]).includes(tone.value))
        problems.push(`<Callout tone> must be one of ${CALLOUT_TONES.join(", ")}, written as a plain string`);
    }
    const otherAttributes = node.attributes?.filter(attribute => !(name === "Callout" && attribute.name === "tone"));
    if (otherAttributes?.length) problems.push(`<${name}> takes no attributes besides Callout's tone`);
  }
  for (const name of ["ShortAnswer", "ScopeNote"]) {
    if (counts.get(name) !== 1) problems.push(`<${name}> must appear exactly once (found ${counts.get(name) ?? 0})`);
  }
  return problems;
};

// Markdown that parses but is not in the article vocabulary.
const FORBIDDEN_NODES: Record<string, string> = {
  image: "images are not in the MDX vocabulary",
  imageReference: "images are not in the MDX vocabulary",
  footnoteReference: "footnotes render after the disclaimer: cite in ## Sources instead",
  footnoteDefinition: "footnotes render after the disclaimer: cite in ## Sources instead",
  mdxFlowExpression: "{…} runs code at build time and skips the content checks (only {/* comments */} are allowed)",
  mdxTextExpression: "{…} runs code at build time and skips the content checks (only {/* comments */} are allowed)",
};

const checkMarkdown = (tree: MdNode) =>
  collect(tree, node => node.type in FORBIDDEN_NODES && !isCommentExpression(node)).map(node => {
    const detail = isExpression(node) ? ` {${squash(node.value ?? "")}}` : "";
    return `${node.type}${detail}: ${FORBIDDEN_NODES[node.type]}`;
  });

const checkHeadings = (tree: MdNode) => {
  const problems: string[] = [];
  const headings = headingsOf(tree);
  let previousDepth = 1; // the page template renders the H1
  for (const heading of headings) {
    const depth = heading.depth ?? 0;
    const text = squash(textOf(heading, { code: true }));
    if (depth === 1) problems.push(`H1 in the body ("${text}"): the page renders meta.h1; start at ##`);
    else if (depth > previousDepth + 1)
      problems.push(`skipped heading level: h${previousDepth} -> h${depth} ("${text}")`);
    if (!headingId(text)) problems.push(`heading "${text}" has no usable anchor id`);
    previousDepth = Math.max(depth, 1);
  }
  const ids = headingIdsOf(tree);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length) problems.push(`duplicate heading anchors: ${duplicates.join(", ")}`);
  return problems;
};

/** The pages a post may link to in its language (blog build spec, "MDX vocabulary"), besides its posts. */
const internalPaths = (locale: Locale) => [
  routePath(locale, "home"),
  routePath(locale, "dashboard"),
  routePath(locale, "morpho"),
  routePath(locale, "blog"),
  routePath(locale, "privacy"),
];

const checkLinks = (tree: MdNode, locale: Locale = "en", index: PostIndex = POST_INDEX[locale]) => {
  const problems: string[] = [];
  const ownIds = new Set(headingIdsOf(tree));
  const paths = internalPaths(locale);
  const blogPrefix = postPath(locale, "");
  const urls = collect(tree, node => node.type === "link" || node.type === "definition").map(node => node.url ?? "");
  for (const url of urls) {
    if (SITE_HOST.test(url)) {
      problems.push(`${url}: link to tokenping.xyz pages with a relative path`);
    } else if (url.startsWith("#")) {
      if (!ownIds.has(url.slice(1))) problems.push(`${url}: no heading with this anchor in this post`);
    } else if (url.startsWith("/")) {
      const [pathname, hash] = url.split("#");
      const target = pathname.startsWith(blogPrefix) ? pathname.slice(blogPrefix.length) : undefined;
      const linked = localeFromPath(pathname);
      if (linked !== locale) {
        const slug = pathname.startsWith(postPath(linked, "")) ? pathname.slice(postPath(linked, "").length) : "";
        const key = postKeyForSlug(linked, slug);
        const translated = key ? postPath(locale, POST_SLUGS[key][locale]) : undefined;
        problems.push(
          `${url}: a page in the other language; link to ${translated ?? paths.join(", ")} (i18n/routes, i18n/postSlugs)`,
        );
      } else if (target !== undefined && /^[^/?#]+$/.test(target)) {
        const anchors = index.headingIds.get(target);
        const key = postKeyForSlug("en", target);
        if (anchors === undefined) {
          const hint = locale !== "en" && key ? `; the ${locale} slug is "${POST_SLUGS[key][locale]}"` : "";
          problems.push(`${url}: no post with the slug "${target}"${hint}`);
        }
        // A placeholder's anchors do not exist yet; the link is checked again once the article replaces it.
        else if (hash !== undefined && anchors !== null && !anchors.has(hash))
          problems.push(`${url}: no heading with the anchor "#${hash}" in ${target}`);
      } else if (!paths.includes(pathname) || hash !== undefined) {
        problems.push(
          `${url}: internal links may only point to ${paths.slice(0, -1).join(", ")}, ${paths.at(-1)} or ${blogPrefix}<slug>`,
        );
      }
    } else if (!url.startsWith("https://")) {
      problems.push(`${url || "(empty)"}: external links must be absolute https:// URLs`);
    }
  }
  return problems;
};

const checkEnding = (tree: MdNode, locale: Locale = "en") => {
  const { disclaimer, sourcesHeading, fetchedDate, fetchedFormat } = LANGUAGE_RULES[locale];
  const problems: string[] = [];
  const body = bodyOf(tree);
  const h2s = body.filter(node => node.type === "heading" && node.depth === 2);
  const lastH2 = h2s.at(-1);
  if (!lastH2 || squash(textOf(lastH2)) !== sourcesHeading) {
    problems.push(`the last H2 must be "## ${sourcesHeading}"`);
    return problems;
  }
  const last = body.at(-1);
  const isDisclaimer =
    last?.type === "paragraph" &&
    last.children?.length === 1 &&
    last.children[0].type === "emphasis" &&
    squash(textOf(last)) === disclaimer;
  if (!isDisclaimer) problems.push(`the post must end with the line *${disclaimer}*`);

  const section = body.slice(body.indexOf(lastH2) + 1, isDisclaimer ? -1 : undefined);
  const items = section.filter(node => node.type === "list").flatMap(list => list.children ?? []);
  if (items.length === 0) problems.push(`## ${sourcesHeading} needs a list of links`);
  for (const item of items) {
    const text = squash(textOf(item));
    if (!collect(item, node => node.type === "link").length) problems.push(`source without a link: "${text}"`);
    if (!fetchedDate.test(text)) problems.push(`source without "${fetchedFormat}": "${text}"`);
  }
  return problems;
};

const checkReadingTime = (tree: MdNode, meta: PostMeta) => {
  const words = proseOf(tree).split(" ").filter(Boolean).length;
  const expected = words / WORDS_PER_MINUTE;
  const tolerance = Math.max(2, expected * 0.35);
  return Math.abs(meta.readingMinutes - expected) > tolerance
    ? [`readingMinutes ${meta.readingMinutes} is not an honest estimate for ${words} words (≈ ${expected.toFixed(1)})`]
    : [];
};

const LANGUAGE_DIRS: Record<Locale, string> = {
  en: "content/blog",
  cs: "content/blog/cs",
  es: "content/blog/es",
  hi: "content/blog/hi",
};

for (const locale of LOCALES) {
  const { files, sources, posts } = LANGUAGES[locale];
  const rules = LANGUAGE_RULES[locale];

  describe(`${LANGUAGE_DIRS[locale]} posts`, () => {
    it("finds the post files", () => {
      expect(files.length).toBeGreaterThan(0);
    });

    // Placeholders share their wording, so only written articles must differ.
    it("have unique titles, descriptions and headlines", () => {
      for (const field of ["title", "description", "h1"] as const) {
        const values = posts.filter(({ meta }) => !meta?.stub).map(({ meta }) => meta?.[field]);
        expect(new Set(values).size, `duplicate meta.${field}`).toBe(values.length);
      }
    });

    for (const post of posts) {
      const { slug, tree, meta } = post;

      describe(slug, () => {
        it("compiles with @mdx-js/mdx and remark-gfm", () => {
          expect(post.error, String(post.error)).toBeUndefined();
        });

        it("has valid meta", () => {
          expect(checkMeta(post)).toEqual([]);
        });

        // Placeholders too: the rule covers every character a post ships, meta included.
        it("uses no em or en dashes", () => {
          expect(findDashes(sources.get(slug) ?? "")).toEqual([]);
        });

        if (!tree || !meta) return;

        if (meta.stub) {
          it("stays a short placeholder while marked as a stub", () => {
            const words = proseOf(tree).split(" ").filter(Boolean).length;
            expect(words, "the post has real content: remove `stub: true` from its meta").toBeLessThanOrEqual(
              MAX_STUB_WORDS,
            );
          });
          it.todo("stub: replace the placeholder with the article, then the full content checks run");
          return;
        }

        it("exports only meta, as the first statement", () => {
          expect(checkEsm(tree)).toEqual([]);
        });

        it("starts with <ShortAnswer> and then <ScopeNote />", () => {
          expect(checkOpening(tree)).toEqual([]);
        });

        it("uses only the MDX vocabulary", () => {
          expect([...checkJsx(tree, slug, locale), ...checkMarkdown(tree)]).toEqual([]);
        });

        it("has no H1, no skipped heading levels and unique anchors", () => {
          expect(checkHeadings(tree)).toEqual([]);
        });

        it("links only to real posts, allowed pages and https sources, in its own language", () => {
          expect(checkLinks(tree, locale)).toEqual([]);
        });

        it(`ends with ## ${rules.sourcesHeading} (fetched dates) and the disclaimer line`, () => {
          expect(checkEnding(tree, locale)).toEqual([]);
        });

        it("contains no banned phrases and no hard-coded alert price", () => {
          expect(findBannedPhrases(proseOf(tree), rules.bannedPatterns)).toEqual([]);
        });

        it("has an honest reading time", () => {
          expect(checkReadingTime(tree, meta)).toEqual([]);
        });
      });
    }
  });
}

describe("i18n/postSlugs", () => {
  it.each(LOCALES)("pairs every post with a %s file of that slug, and every %s file with an entry", locale => {
    const files = LANGUAGES[locale].posts.map(({ slug }) => slug).sort();
    expect(files).toEqual(
      Object.values(POST_SLUGS)
        .map(slugs => slugs[locale])
        .sort(),
    );
  });

  it("uses the English slug as the key and a distinct slug per language", () => {
    for (const [key, slugs] of Object.entries(POST_SLUGS)) expect(slugs.en, key).toBe(key);
    for (const locale of LOCALES) {
      const slugs = Object.values(POST_SLUGS).map(entry => entry[locale]);
      expect(new Set(slugs).size, locale).toBe(slugs.length);
    }
  });
});

// The checker itself, so a loosened pattern cannot silently pass every post.
describe("findBannedPhrases", () => {
  it.each([
    "With alerts you will never get liquidated.",
    "So you never miss a warning.",
    "Real-time alerts for your position.",
    "You get an instant message.",
    "A multi-protocol dashboard.",
    "Tokenping is open-source licensed.",
    "Isolation Mode is a way to list new assets.",
    "The close factor is 50%.",
    "Alerts cost 3 USDC.",
    "Alerts cost $3 USDC for 30 days.",
    "That is 3.00 USDC per month.",
    "You pay USDC per 30 days.",
    "See bgd-labs/aave-capo for the adapters.",
    "Your alerts keep running after the subscription ends.",
    "The debt ceiling limits how much you can borrow against it.",
    "Isolated assets are subject to a debt ceiling.",
    "On L2s, liquidations pause while the sequencer is down.",
    "Liquidations can be paused when the Arbitrum sequencer goes offline.",
    "The sequencer sentinel blocks liquidations for an hour.",
    "A liquidator can repay 100% of the debt when HF < 0.95.",
    "All of it can be liquidated if the health factor is below 0.95.",
    "Alerts arrive on Signal or email [or Telegram].",
    "Check your health factor for free.",
    "Free alerts on Telegram.",
    "A freemium alert service.",
  ])("flags %j", text => {
    expect(findBannedPhrases(text)).not.toEqual([]);
  });

  it.each([
    "Isolation Mode was removed in Aave V3.7.",
    "Isolation Mode is no longer a feature of these markets.",
    "The close factor is no longer a flat 50%.",
    "Up to 50% of the debt can be repaid when HF is above 0.95.",
    'The aave.com Pool page still says "close factor is 0.5".',
    "Debt of 12,000 USDC against 10 WETH.",
    "A position with 13 USDC of debt, or 0.3 USDC, or 3,000 USDC.",
    "Alerts give you time to act; they don't prevent liquidation.",
    "The instance of a timestamp.",
    "Debt ceilings were removed in Aave V3.7.",
    "V3.7 removed Isolation Mode and its debt ceilings.",
    "The asset no longer has a debt ceiling.",
    "Before v3.7, L2 markets could block liquidations while the sequencer was down.",
    "Since v3.7, liquidations no longer pause when the sequencer is down.",
    "A sequencer outage no longer blocks liquidations.",
    "Up to 100% can be repaid when HF is at or below 0.95, written HF ≤ 0.95.",
    'The V4 overview says "100% when HF < 0.95"; the code uses ≤.',
    "Tokenping messages you on Signal or email.",
    "Tokenping sends alerts on Signal, Telegram and email.",
    "Otomato sends alerts on Telegram and in its mobile app.",
    "DeFi Saver Notify: in-app, email, Telegram.",
    "Otomato's core alerts cost nothing; the extensions come at no charge.",
    "Looking at your positions needs no payment.",
    "A frozen reserve does not block liquidations.",
  ])("does not flag %j", text => {
    expect(findBannedPhrases(text)).toEqual([]);
  });
});

describe("findDashes", () => {
  const entity = (name: string) => `&${name};`;
  const numericEntity = (code: string) => `&#${code};`;
  const jsEscape = (code: string) => `\\u${code}`;

  it.each([
    [`Fast ${EM_DASH} and audited.`, "em dash"],
    [`One thing${EM_DASH}the important one.`, "em dash"],
    [`From $10k ${EN_DASH} $50k.`, "en dash"],
    [`Blocks 26194050${EN_DASH}26194060.`, "en dash"],
    [`Fast ${entity("mdash")} and audited.`, "em dash"],
    [`2025${entity("ndash")}2026`, "en dash"],
    [`Fast ${numericEntity("8212")} and audited.`, "em dash"],
    [`2025${numericEntity("x2013")}2026`, "en dash"],
    [`Fast ${numericEntity("X2014")} and audited.`, "em dash"],
    [`title: "Fast ${jsEscape("2014")} and audited.",`, "em dash"],
    [`{"2025${jsEscape("{2013}")}2026"}`, "en dash"],
  ])("flags %j as an %s", (text, kind) => {
    expect(findDashes(text)).toEqual([`line 1: ${kind} in "${text}"`]);
  });

  it("reports every dash with its line and nearby text", () => {
    const source = ["No dash here.", `A ${EM_DASH} B and C ${EN_DASH} D`].join("\n");
    expect(findDashes(source)).toEqual([
      `line 2: em dash in "A ${EM_DASH} B and C ${EN_DASH} D"`,
      `line 2: en dash in "A ${EM_DASH} B and C ${EN_DASH} D"`,
    ]);
  });

  it.each([
    "Fast and audited.",
    "One thing: the important one.",
    "Blocks 26194050-26194060, 2025-2026.",
    "How to read your health factor - Tokenping",
    "Liquidation price of A = (debt − value of B × LT of B) ÷ (amount of A × LT of A)",
    "Contract `0xaf88...5831`.",
    "An &amp; entity and &minus; are fine.",
    `A minus written as ${jsEscape("2212")} is fine.`,
  ])("does not flag %j", text => {
    expect(findDashes(text)).toEqual([]);
  });
});

// The full article checks on two fixtures: a post that follows the contract passes every check, and a post that
// breaks it is caught by each one.
const FIXTURE_META: PostMeta = {
  slug: "aave-health-factor",
  title: "Aave health factor explained: formula and examples",
  description:
    "What the Aave V3 health factor is, how to calculate it with a worked example, and what happens below 1.",
  h1: "What is the Aave health factor, and how is it calculated?",
  publishedAt: "2026-10-14",
  primaryQuestion: "What is the Aave health factor and how is it calculated?",
  readingMinutes: 1,
};
const FIXTURE_META_EXPORT = `export const meta = ${JSON.stringify(FIXTURE_META, null, 2)};`;

const GOOD_ARTICLE = `${FIXTURE_META_EXPORT}

<ShortAnswer>
The health factor compares your collateral, weighted by its liquidation threshold, with your debt. Below 1.00 the
position can be liquidated.
</ShortAnswer>

<ScopeNote />

{/* A writer's note stays out of the page. */}

## What is the health factor on Aave?

The health factor is a number {/* inline note */}. Below 1.00 a liquidator can repay up to 100% of the debt when
HF is at or below 0.95. Otomato sends alerts on Telegram. See [how much buffer a health factor gives you](/blog/safe-aave-health-factor) or
[check your Aave V3 health factor](/aave). Alerts cost <AlertPrice />. What the site stores is on the
[privacy page](/privacy). Formula details are in [the formula section](#how-is-the-health-factor-calculated).

## How is the health factor calculated?

| Asset | LT |
|---|---|
| WETH | 83% |

### With \`getUserAccountData\`

<Callout tone="warning">
A paused reserve blocks liquidations; a frozen one does not.
</Callout>

## Sources

- [Aave V3 docs](https://aave.com/docs) (fetched 14 Oct 2026)

*${ARTICLE_DISCLAIMER}*
`;

const BAD_ARTICLE = `${FIXTURE_META_EXPORT}
import { Foo } from "./foo";

Intro paragraph first.

<ShortAnswer>Short.</ShortAnswer>

# A second title

#### Skipped a level

<div>raw html</div>

<Callout tone="danger">Bad tone.</Callout>

<LiquidationCalculator />

Real-time alerts for 3 USDC, free to try. See [a missing post](/blog/nope), [a bad anchor](/blog/safe-aave-health-factor#nope),
[admin](/admin), [plain http](http://example.com) and [our site](https://tokenping.xyz/aave).

The debt ceiling limits new borrows. On Arbitrum, liquidations pause while the sequencer is down. A liquidator can
repay 100% when HF < 0.95. Alerts arrive on Signal or email [or Telegram].[^1]

![HF chart](http://example.com/chart.png)

Alerts cost {"three dollars"} today.

{/* a */ "hidden" /* b */}

[^1]: A footnote below the disclaimer.

## Sources

- [A source without a date](https://aave.com/docs)

The end ${EM_DASH} for now, 2025${EN_DASH}2026.
`;

const articleChecks = (tree: MdNode, meta: PostMeta, slug: string) => ({
  esm: checkEsm(tree),
  opening: checkOpening(tree),
  jsx: checkJsx(tree, slug),
  markdown: checkMarkdown(tree),
  headings: checkHeadings(tree),
  links: checkLinks(tree),
  ending: checkEnding(tree),
  banned: findBannedPhrases(proseOf(tree)),
  readingTime: checkReadingTime(tree, meta),
});

describe("checkMeta", () => {
  it.each(["2026-13-40", "2026-02-30", "14 Oct 2026"])("reports the invalid date %j instead of throwing", date => {
    expect(checkMeta({ slug: FIXTURE_META.slug, meta: { ...FIXTURE_META, publishedAt: date } })).toEqual([
      `meta.publishedAt "${date}" must be a YYYY-MM-DD date`,
    ]);
  });
});

describe("article checks", () => {
  it("pass a post that follows the content contract", async () => {
    const { tree, meta, error } = await parsePost(GOOD_ARTICLE, "aave-health-factor");
    expect(error).toBeUndefined();
    expect(findDashes(GOOD_ARTICLE)).toEqual([]);
    expect(meta).toEqual(FIXTURE_META);
    expect(checkMeta({ slug: "aave-health-factor", meta })).toEqual([]);
    expect(articleChecks(tree!, meta!, "aave-health-factor")).toEqual({
      esm: [],
      opening: [],
      jsx: [],
      markdown: [],
      headings: [],
      links: [],
      ending: [],
      banned: [],
      readingTime: [],
    });
  });

  it("catch every way a post can break it", async () => {
    const { tree, error } = await parsePost(BAD_ARTICLE, "aave-health-factor");
    // The import alone already fails the "compiles" check.
    expect(String(error)).toMatch(/import/);
    const checks = articleChecks(tree!, { ...FIXTURE_META, readingMinutes: 30 }, "aave-health-factor");

    expect(checks.esm).toEqual(["found 2 import/export statements; only the meta export is allowed"]);
    expect(checks.opening).toEqual([
      "the body must start with <ShortAnswer>…</ShortAnswer>",
      "<ScopeNote /> must come right after <ShortAnswer>",
    ]);
    expect(checks.jsx).toEqual([
      expect.stringContaining("<div> is not in the MDX vocabulary"),
      "<Callout tone> must be one of info, warning, written as a plain string",
      "<LiquidationCalculator> belongs to aave-liquidation-price only",
      "<ScopeNote> must appear exactly once (found 0)",
    ]);
    expect(checks.markdown).toEqual([
      expect.stringMatching(/^footnoteReference: /),
      expect.stringMatching(/^image: images are not in the MDX vocabulary/),
      expect.stringMatching(/^mdxTextExpression \{"three dollars"\}: /),
      expect.stringMatching(/^mdxFlowExpression \{\/\* a \*\/ "hidden" \/\* b \*\/\}: /),
      expect.stringMatching(/^footnoteDefinition: /),
    ]);
    expect(checks.headings).toEqual([
      'H1 in the body ("A second title"): the page renders meta.h1; start at ##',
      'skipped heading level: h1 -> h4 ("Skipped a level")',
    ]);
    expect(checks.links).toEqual([
      '/blog/nope: no post with the slug "nope"',
      '/blog/safe-aave-health-factor#nope: no heading with the anchor "#nope" in safe-aave-health-factor',
      "/admin: internal links may only point to /, /aave, /morpho, /blog, /privacy or /blog/<slug>",
      "http://example.com: external links must be absolute https:// URLs",
      "https://tokenping.xyz/aave: link to tokenping.xyz pages with a relative path",
    ]);
    expect(checks.ending).toEqual([
      `the post must end with the line *${ARTICLE_DISCLAIMER}*`,
      'source without "fetched <d Mon yyyy>": "A source without a date"',
    ]);
    expect(checks.banned).toEqual([
      expect.stringContaining("'real-time'"),
      expect.stringContaining("debt ceilings were removed"),
      expect.stringContaining("sequencer downtime no longer pauses liquidations"),
      expect.stringContaining("HF ≤ 0.95"),
      expect.stringContaining("[Telegram variant] placeholder must not ship"),
      expect.stringContaining("hard-coded alert price"),
      expect.stringContaining("'free' must not appear"),
    ]);
    expect(checks.readingTime).toEqual([expect.stringContaining("readingMinutes 30 is not an honest estimate")]);
    expect(findDashes(BAD_ARTICLE)).toEqual([
      expect.stringMatching(/^line \d+: em dash in "The end /),
      expect.stringMatching(/^line \d+: en dash in "The end /),
    ]);
  });
});

describe("Czech findBannedPhrases", () => {
  const czech = LANGUAGE_RULES.cs.bannedPatterns;

  it.each([
    "S upozorněním nikdy nebudete zlikvidováni.",
    "Už nikdy nezmeškáte varování.",
    "Upozornění v reálném čase.",
    "Pošleme vám okamžité upozornění.",
    "Multiprotokolový přehled.",
    "Close factor je 50 %.",
    "Upozornění stojí 3 USDC.",
    "Upozornění stojí 3,00 USDC na měsíc.",
    "Platíte v USDC na 30 dní.",
    "Přehled je zdarma.",
    "Bezplatná upozornění na Telegram.",
    "Otomato nabízí bezplatnou úroveň.",
  ])("flags %j", text => {
    expect(findBannedPhrases(text, czech)).not.toEqual([]);
  });

  it.each([
    "Close factor už není plošných 50 %.",
    "Stránka Pool na aave.com stále uvádí „close factor is 0.5“.",
    "Dluh 12 000 USDC proti 10 WETH.",
    "Pozice s dluhem 13 USDC nebo 3 000 USDC.",
    "Tokenping vám napíše přes Signal nebo e-mail.",
    "Tokenping posílá upozornění přes Signal, Telegram i e-mail.",
    "Otomato posílá upozornění přes Telegram a ve své aplikaci.",
    "Likvidace proběhne okamžitě, jakmile health factor klesne pod 1.",
    "Základní sledování je bez poplatku a nic nestojí; přehled nevyžaduje platbu.",
  ])("does not flag %j", text => {
    expect(findBannedPhrases(text, czech)).toEqual([]);
  });
});

const CS_FIXTURE_META: PostMeta = {
  slug: "aave-health-factor-vysvetleni",
  title: "Health factor na Aave: vzorec a příklady",
  description:
    "Co je health factor na Aave V3, jak ho spočítat na propočítaném příkladu a co se stane, když klesne pod 1.",
  h1: "Co je health factor na Aave a jak se počítá?",
  publishedAt: "2026-10-14",
  primaryQuestion: "Co je health factor na Aave a jak se počítá?",
  readingMinutes: 1,
};

const GOOD_CS_ARTICLE = `export const meta = ${JSON.stringify(CS_FIXTURE_META, null, 2)};

<ShortAnswer>
Health factor porovnává váš kolaterál vážený likvidačním prahem s vaším dluhem. Pod 1,00 může být pozice
zlikvidována.
</ShortAnswer>

<ScopeNote />

## Co je health factor na Aave?

Health factor je číslo. Kolik rezervy dává, popisuje [průvodce bezpečným health factorem](/cz/blog/bezpecny-health-factor-aave),
svůj si [zkontrolujete v přehledu](/cz/aave). Upozornění stojí <AlertPrice />. Co web ukládá, je na
[stránce o ochraně soukromí](/cz/ochrana-soukromi). Vzorec je v [části o výpočtu](#jak-se-pocita-health-factor).

## Jak se počítá health factor?

<Callout tone="warning">
Pozastavená rezerva likvidace blokuje, zmrazená ne.
</Callout>

## Zdroje

- [Dokumentace Aave V3](https://aave.com/docs) (načteno 14. října 2026)

*${CS_ARTICLE_DISCLAIMER}*
`;

const BAD_CS_ARTICLE = `export const meta = ${JSON.stringify(CS_FIXTURE_META, null, 2)};

<ShortAnswer>Krátce.</ShortAnswer>

<ScopeNote />

<LiquidationCalculator />

Viz [anglický průvodce](/blog/safe-aave-health-factor), [anglický přehled](/aave), [domovská stránka](/),
[anglický slug](/cz/blog/safe-aave-health-factor), [správa](/cz/admin) a
[špatná kotva](/cz/blog/bezpecny-health-factor-aave#nope).

## Sources

- [Dokumentace Aave V3](https://aave.com/docs) (fetched 14 Oct 2026)

*${ARTICLE_DISCLAIMER}*
`;

describe("Czech article checks", () => {
  it("pass a Czech post that follows the content contract", async () => {
    const { tree, meta, error } = await parsePost(GOOD_CS_ARTICLE, CS_FIXTURE_META.slug, "cs");
    expect(error).toBeUndefined();
    expect(findDashes(GOOD_CS_ARTICLE)).toEqual([]);
    expect(checkMeta({ slug: CS_FIXTURE_META.slug, locale: "cs", meta })).toEqual([]);
    expect({
      esm: checkEsm(tree!),
      opening: checkOpening(tree!),
      jsx: checkJsx(tree!, CS_FIXTURE_META.slug, "cs"),
      headings: checkHeadings(tree!),
      links: checkLinks(tree!, "cs"),
      ending: checkEnding(tree!, "cs"),
      banned: findBannedPhrases(proseOf(tree!), LANGUAGE_RULES.cs.bannedPatterns),
    }).toEqual({ esm: [], opening: [], jsx: [], headings: [], links: [], ending: [], banned: [] });
  });

  it("allow the calculator in the translation of its post only", async () => {
    const calculator = `${GOOD_CS_ARTICLE.split("## Zdroje")[0]}<LiquidationCalculator />\n`;
    const { tree } = await parsePost(calculator, "likvidacni-cena-aave", "cs");

    expect(checkJsx(tree!, "likvidacni-cena-aave", "cs")).toEqual([]);
    expect(checkJsx(tree!, CS_FIXTURE_META.slug, "cs")).toEqual([
      "<LiquidationCalculator> belongs to likvidacni-cena-aave only",
    ]);
  });

  it("catch English links, English slugs, English endings and missing anchors", async () => {
    const { tree } = await parsePost(BAD_CS_ARTICLE, CS_FIXTURE_META.slug, "cs");

    expect(checkJsx(tree!, CS_FIXTURE_META.slug, "cs")).toEqual([
      "<LiquidationCalculator> belongs to likvidacni-cena-aave only",
    ]);
    expect(checkLinks(tree!, "cs")).toEqual([
      "/blog/safe-aave-health-factor: a page in the other language; link to /cz/blog/bezpecny-health-factor-aave (i18n/routes, i18n/postSlugs)",
      "/aave: a page in the other language; link to /cz, /cz/aave, /cz/morpho, /cz/blog, /cz/ochrana-soukromi (i18n/routes, i18n/postSlugs)",
      "/: a page in the other language; link to /cz, /cz/aave, /cz/morpho, /cz/blog, /cz/ochrana-soukromi (i18n/routes, i18n/postSlugs)",
      '/cz/blog/safe-aave-health-factor: no post with the slug "safe-aave-health-factor"; the cs slug is "bezpecny-health-factor-aave"',
      "/cz/admin: internal links may only point to /cz, /cz/aave, /cz/morpho, /cz/blog, /cz/ochrana-soukromi or /cz/blog/<slug>",
      '/cz/blog/bezpecny-health-factor-aave#nope: no heading with the anchor "#nope" in bezpecny-health-factor-aave',
    ]);
    expect(checkEnding(tree!, "cs")).toEqual(['the last H2 must be "## Zdroje"']);
  });

  it("report an English disclaimer and source dates under ## Zdroje", async () => {
    const source = BAD_CS_ARTICLE.replace("## Sources", "## Zdroje");
    const { tree } = await parsePost(source, CS_FIXTURE_META.slug, "cs");

    expect(checkEnding(tree!, "cs")).toEqual([
      `the post must end with the line *${CS_ARTICLE_DISCLAIMER}*`,
      'source without "načteno <d. měsíce yyyy>": "Dokumentace Aave V3 (fetched 14 Oct 2026)"',
    ]);
  });

  it("flag a link from an English post to a Czech page", async () => {
    const { tree } = await parsePost(GOOD_ARTICLE.replace("(/aave)", "(/cz/aave)"), "aave-health-factor");

    expect(checkLinks(tree!)).toEqual([
      "/cz/aave: a page in the other language; link to /, /aave, /morpho, /blog, /privacy (i18n/routes, i18n/postSlugs)",
    ]);
  });

  it("give a placeholder the meta checks without asking it for a question or a long description", () => {
    const stub: PostMeta = {
      ...CS_FIXTURE_META,
      title: "Překlad se připravuje",
      description: "Překlad se připravuje.",
      primaryQuestion: "Překlad se připravuje.",
      stub: true,
    };
    expect(checkMeta({ slug: stub.slug, locale: "cs", meta: stub })).toEqual([]);
    expect(checkMeta({ slug: stub.slug, locale: "cs", meta: { ...stub, stub: undefined } })).toEqual([
      "meta.description is 22 chars (50 to 155)",
      "meta.primaryQuestion must be a question ending in '?'",
    ]);
  });
});
