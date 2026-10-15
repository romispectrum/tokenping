import { evaluate } from "@mdx-js/mdx";
import { readFileSync, readdirSync } from "node:fs";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";
import { CALLOUT_TONES } from "~~/components/blog/Callout";
import { headingId } from "~~/components/blog/headingId";
import { CHILDLESS_COMPONENTS, MDX_VOCABULARY_NAMES, SINGLE_POST_COMPONENTS } from "~~/components/blog/vocabulary";
import type { PostMeta } from "~~/content/blog/types";

// Content lint for every content/blog/*.mdx post: the article contract from the blog build spec, checked on the parsed
// MDX tree (after remark-gfm) rather than on raw text, so code, URLs and JSX attributes cannot cause false positives.
// Placeholder posts (`stub: true` in meta) get the meta checks and are reported as pending for the rest.

const BLOG_DIR = new URL("./", import.meta.url);

const ARTICLE_DISCLAIMER =
  "Educational content, not financial advice. Alerts reduce risk; they do not prevent liquidation.";
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
]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const FETCHED_DATE = /\bfetched (?:on )?\d{1,2} (?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}\b/i;
// Internal paths an article may link to, besides /blog/<slug> (blog build spec, "MDX vocabulary").
const INTERNAL_PATHS = new Set(["/", "/aave", "/blog"]);
const SITE_HOST = /^https?:\/\/(?:www\.)?tokenping\.xyz(?:[/?#]|$)/i;

type BannedPattern = {
  pattern: RegExp;
  reason: string;
  /** Stale claims may be quoted to correct them ('aave.com still says "close factor is 0.5"'); claims about us not. */
  allowQuoted?: boolean;
};

// Copy that must not appear (marketing plan §4.5, product facts §11) and stale Aave claims (Aave fact sheet §9).
// Each pattern targets the claim, not the topic: "Isolation Mode was removed in V3.7" and "the close factor is no
// longer a flat 50%" pass.
const NOT_CORRECTED = String.raw`(?! (?:no longer|not|gone|removed|deprecated|replaced|retired))`;
const NOT_NEGATED = String.raw`(?<!(?:no longer|not|never|n't) )`;
const LIST_SEPARATOR = String.raw`(?:,? (?:or|and|&|plus) |, | ?\/ ?)`;
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /\bnever (?:get|be|getting|being) liquidated\b/i, reason: "guarantee: 'never get liquidated'" },
  { pattern: /\bnever miss(?:es|ed)?\b/i, reason: "guarantee: 'never miss'" },
  { pattern: /\breal[- ]time\b/i, reason: "'real-time' (alerts are checked every 5 minutes)" },
  { pattern: /\binstant(?:ly|aneous|aneously)?\b/i, reason: "'instant' (alerts are checked every 5 minutes)" },
  { pattern: /\bmulti[- ]?protocol\b/i, reason: "'multi-protocol' (only Aave V3 is supported)" },
  { pattern: /\bopen[- ]source[- ]licen[cs]ed\b/i, reason: "'open-source licensed' (the repo has no LICENSE)" },
  { pattern: /\bsecure settings\b/i, reason: "'secure settings' (settings are not access-controlled)" },
  { pattern: /\bonly you can see\b/i, reason: "'only you can see' (settings are not access-controlled)" },
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
  // Articles name Signal and email only (blog build spec). No researched competitor offers Signal, so Signal listed
  // together with Telegram is a claim about Tokenping; competitors' Telegram bots may still be described.
  {
    pattern: new RegExp(
      String.raw`\bSignal(?:${LIST_SEPARATOR}e-?mail)?${LIST_SEPARATOR}Telegram\b|\bTelegram(?:${LIST_SEPARATOR}e-?mail)?${LIST_SEPARATOR}Signal\b`,
      "i",
    ),
    reason: "Tokenping channels: articles name Signal and email only until the Telegram bot is live",
  },
  {
    pattern: /\[(?:or |and |plus |\+ ?)?Telegram\b[^\]]*\]/i,
    reason: "the plan's [Telegram variant] placeholder must not ship: articles name Signal and email only",
  },
  {
    pattern: /\bTelegram alerts?\b/i,
    reason:
      "'Telegram alerts' is not safe copy until the bot is live (product facts §11); for a competitor write 'alerts on Telegram'",
  },
  {
    pattern: /(?<![\d.,])\$?3(?:\.0+)? ?USDC\b/i,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: /\bUSDC (?:per|for|every|\/) ?30 days\b/i, reason: "hard-coded alert plan: use <AlertPrice />" },
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

const normalizeQuotes = (text: string) => text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
const stripQuoted = (text: string) => text.replace(/"[^"\n]*"/g, '""');

const findBannedPhrases = (text: string) => {
  const normalized = normalizeQuotes(text);
  return BANNED_PATTERNS.flatMap(({ pattern, reason, allowQuoted }) => {
    const match = (allowQuoted ? stripQuoted(normalized) : normalized).match(pattern);
    return match ? [`"${match[0]}": ${reason}`] : [];
  });
};

type LoadedPost = {
  slug: string;
  tree?: MdNode;
  meta?: PostMeta;
  error?: unknown;
};

/** Compiles and evaluates one post with remark-gfm, keeping the mdast tree for the checks below. */
const parsePost = async (source: string, slug: string): Promise<LoadedPost> => {
  let tree: MdNode | undefined;
  const captureTree = () => (root: MdNode) => {
    tree = root;
  };
  try {
    const exports = await evaluate(
      { value: source, path: `${slug}.mdx` },
      { ...(runtime as unknown as Parameters<typeof evaluate>[1]), remarkPlugins: [remarkGfm, captureTree] },
    );
    return { slug, tree, meta: exports.meta as PostMeta | undefined };
  } catch (error) {
    // The tree is captured before evaluation, so the checks can still explain what is wrong.
    return { slug, tree, error };
  }
};

const FILES = readdirSync(BLOG_DIR)
  .filter(file => file.endsWith(".mdx"))
  .sort();
const POSTS = await Promise.all(
  FILES.map(file => parsePost(readFileSync(new URL(file, BLOG_DIR), "utf8"), file.replace(/\.mdx$/, ""))),
);
const SLUGS = new Set(POSTS.map(({ slug }) => slug));

const headingsOf = (tree: MdNode) => collect(tree, node => node.type === "heading");
const headingIdsOf = (tree: MdNode) => headingsOf(tree).map(node => headingId(squash(textOf(node, { code: true }))));
const HEADING_IDS = new Map(POSTS.map(({ slug, tree }) => [slug, new Set(tree ? headingIdsOf(tree) : [])]));

const checkMeta = (post: LoadedPost): string[] => {
  const { meta, slug } = post;
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
  if (!isNonEmpty(meta.description)) problems.push("meta.description must be a non-empty, trimmed string");
  else if (meta.description.length > MAX_DESCRIPTION_LENGTH || meta.description.length < MIN_DESCRIPTION_LENGTH)
    problems.push(
      `meta.description is ${meta.description.length} chars (${MIN_DESCRIPTION_LENGTH}–${MAX_DESCRIPTION_LENGTH})`,
    );
  if (!isNonEmpty(meta.h1)) problems.push("meta.h1 must be a non-empty, trimmed string");
  else if (meta.h1.length > MAX_HEADLINE_LENGTH)
    problems.push(`meta.h1 is ${meta.h1.length} chars (max ${MAX_HEADLINE_LENGTH})`);
  if (!isNonEmpty(meta.primaryQuestion) || !meta.primaryQuestion.endsWith("?"))
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

  for (const field of ["title", "description", "h1", "primaryQuestion"] as const) {
    if (typeof meta[field] === "string")
      problems.push(...findBannedPhrases(meta[field]).map(found => `meta.${field}: ${found}`));
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

const checkJsx = (tree: MdNode, slug: string) => {
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
    if (owner && owner !== slug) problems.push(`<${name}> belongs to ${owner} only`);
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

const checkLinks = (tree: MdNode) => {
  const problems: string[] = [];
  const ownIds = new Set(headingIdsOf(tree));
  const urls = collect(tree, node => node.type === "link" || node.type === "definition").map(node => node.url ?? "");
  for (const url of urls) {
    if (SITE_HOST.test(url)) {
      problems.push(`${url}: link to tokenping.xyz pages with a relative path`);
    } else if (url.startsWith("#")) {
      if (!ownIds.has(url.slice(1))) problems.push(`${url}: no heading with this anchor in this post`);
    } else if (url.startsWith("/")) {
      const [pathname, hash] = url.split("#");
      const target = pathname.match(/^\/blog\/([^/?#]+)$/)?.[1];
      if (target !== undefined) {
        if (!SLUGS.has(target)) problems.push(`${url}: no post with the slug "${target}"`);
        else if (hash !== undefined && !HEADING_IDS.get(target)?.has(hash))
          problems.push(`${url}: no heading with the anchor "#${hash}" in ${target}`);
      } else if (!INTERNAL_PATHS.has(pathname) || hash !== undefined) {
        problems.push(`${url}: internal links may only point to /, /aave, /blog or /blog/<slug>`);
      }
    } else if (!url.startsWith("https://")) {
      problems.push(`${url || "(empty)"}: external links must be absolute https:// URLs`);
    }
  }
  return problems;
};

const checkEnding = (tree: MdNode) => {
  const problems: string[] = [];
  const body = bodyOf(tree);
  const h2s = body.filter(node => node.type === "heading" && node.depth === 2);
  const lastH2 = h2s.at(-1);
  if (!lastH2 || squash(textOf(lastH2)) !== "Sources") {
    problems.push('the last H2 must be "## Sources"');
    return problems;
  }
  const last = body.at(-1);
  const isDisclaimer =
    last?.type === "paragraph" &&
    last.children?.length === 1 &&
    last.children[0].type === "emphasis" &&
    squash(textOf(last)) === ARTICLE_DISCLAIMER;
  if (!isDisclaimer) problems.push(`the post must end with the line *${ARTICLE_DISCLAIMER}*`);

  const section = body.slice(body.indexOf(lastH2) + 1, isDisclaimer ? -1 : undefined);
  const items = section.filter(node => node.type === "list").flatMap(list => list.children ?? []);
  if (items.length === 0) problems.push("## Sources needs a list of links");
  for (const item of items) {
    const text = squash(textOf(item));
    if (!collect(item, node => node.type === "link").length) problems.push(`source without a link: "${text}"`);
    if (!FETCHED_DATE.test(text)) problems.push(`source without "fetched <d Mon yyyy>": "${text}"`);
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

describe("content/blog posts", () => {
  it("finds the post files", () => {
    expect(FILES.length).toBeGreaterThan(0);
  });

  it("have unique titles, descriptions and headlines", () => {
    for (const field of ["title", "description", "h1"] as const) {
      const values = POSTS.map(({ meta }) => meta?.[field]);
      expect(new Set(values).size, `duplicate meta.${field}`).toBe(values.length);
    }
  });

  for (const post of POSTS) {
    const { slug, tree, meta } = post;

    describe(slug, () => {
      it("compiles with @mdx-js/mdx and remark-gfm", () => {
        expect(post.error, String(post.error)).toBeUndefined();
      });

      it("has valid meta", () => {
        expect(checkMeta(post)).toEqual([]);
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
        expect([...checkJsx(tree, slug), ...checkMarkdown(tree)]).toEqual([]);
      });

      it("has no H1, no skipped heading levels and unique anchors", () => {
        expect(checkHeadings(tree)).toEqual([]);
      });

      it("links only to real posts, allowed pages and https sources", () => {
        expect(checkLinks(tree)).toEqual([]);
      });

      it("ends with ## Sources (fetched dates) and the disclaimer line", () => {
        expect(checkEnding(tree)).toEqual([]);
      });

      it("contains no banned phrases and no hard-coded alert price", () => {
        expect(findBannedPhrases(proseOf(tree))).toEqual([]);
      });

      it("has an honest reading time", () => {
        expect(checkReadingTime(tree, meta)).toEqual([]);
      });
    });
  }
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
    "Get alerts on Signal, Telegram or email.",
    "Tokenping messages you on Signal or Telegram.",
    "Alerts arrive on Signal or email [or Telegram].",
    "Tokenping sends Telegram alerts.",
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
    "Otomato sends alerts on Telegram and in its mobile app.",
    "DeFi Saver Notify: in-app, email, Telegram.",
  ])("does not flag %j", text => {
    expect(findBannedPhrases(text)).toEqual([]);
  });
});

// The full article checks on two fixtures: a post that follows the contract passes every check, and a post that
// breaks it is caught by each one.
const FIXTURE_META: PostMeta = {
  slug: "aave-health-factor",
  title: "Aave Health Factor Explained: Formula and Examples",
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
[check your Aave V3 health factor (free)](/aave). Alerts cost <AlertPrice />. Formula details are in
[the formula section](#how-is-the-health-factor-calculated).

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

Real-time alerts for 3 USDC. See [a missing post](/blog/nope), [a bad anchor](/blog/safe-aave-health-factor#nope),
[privacy](/privacy), [plain http](http://example.com) and [our site](https://tokenping.xyz/aave).

The debt ceiling limits new borrows. On Arbitrum, liquidations pause while the sequencer is down. A liquidator can
repay 100% when HF < 0.95. Alerts arrive on Signal, Telegram or email.[^1]

![HF chart](http://example.com/chart.png)

Alerts cost {"three dollars"} today.

{/* a */ "hidden" /* b */}

[^1]: A footnote below the disclaimer.

## Sources

- [A source without a date](https://aave.com/docs)

The end.
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
      "/privacy: internal links may only point to /, /aave, /blog or /blog/<slug>",
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
      expect.stringContaining("articles name Signal and email only"),
      expect.stringContaining("hard-coded alert price"),
    ]);
    expect(checks.readingTime).toEqual([expect.stringContaining("readingMinutes 30 is not an honest estimate")]);
  });
});
