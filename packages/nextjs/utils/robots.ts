// robots.txt, written out here because Next's MetadataRoute.Robots has no field for Content-Signal lines.
import { absoluteUrl } from "~~/utils/seo";

// Search and AI-answer retrieval: blocking any of these removes Tokenping from that search or citation surface.
const RETRIEVAL_BOTS = [
  "Googlebot",
  "bingbot",
  "Applebot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
];
// Model training: a content-licensing choice that does not affect citations. Google-Extended and Applebot-Extended are
// control tokens only; blocking Google-Extended does not change Google Search, AI Overviews or AI Mode.
const TRAINING_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "meta-externalagent",
  "Amazonbot",
  "CCBot",
  "Bytespider",
];
// Founder decision; the default allows training crawlers.
const BLOCK_TRAINING_BOTS = false;
// A crawler obeys only the most specific group that names it, so every group repeats the shared lines.
const DISALLOW = ["/api/"];

/**
 * Content Signals (https://contentsignals.org): how fetched pages may be used. search and ai-input stay yes, because
 * search results and AI answers that quote or link Tokenping are the point; ai-train follows the training-bot choice.
 */
export const CONTENT_SIGNAL = `search=yes, ai-input=yes, ai-train=${BLOCK_TRAINING_BOTS ? "no" : "yes"}`;

type Group = { userAgents: readonly string[]; allow?: string; disallow: readonly string[] };

const GROUPS: readonly Group[] = [
  { userAgents: RETRIEVAL_BOTS, allow: "/", disallow: DISALLOW },
  BLOCK_TRAINING_BOTS
    ? { userAgents: TRAINING_BOTS, disallow: ["/"] }
    : { userAgents: TRAINING_BOTS, allow: "/", disallow: DISALLOW },
  { userAgents: ["*"], allow: "/", disallow: DISALLOW },
];

const groupLines = ({ userAgents, allow, disallow }: Group) => [
  ...userAgents.map(agent => `User-Agent: ${agent}`),
  `Content-Signal: ${CONTENT_SIGNAL}`,
  ...(allow ? [`Allow: ${allow}`] : []),
  ...disallow.map(path => `Disallow: ${path}`),
];

export const buildRobotsTxt = () =>
  [
    "# Content-Signal (https://contentsignals.org) says how fetched pages may be used: search (a search index, links",
    "# and short excerpts), ai-input (input to AI answers, such as retrieval and grounding) and ai-train (training or",
    "# fine-tuning AI models).",
    "",
    ...GROUPS.flatMap(group => [...groupLines(group), ""]),
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
  ].join("\n");
