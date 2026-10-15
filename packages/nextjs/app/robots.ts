import type { MetadataRoute } from "next";
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
// A crawler obeys only the most specific group that names it, so every group repeats the shared disallows.
const DISALLOW = ["/api/"];

const robots = (): MetadataRoute.Robots => ({
  rules: [
    { userAgent: RETRIEVAL_BOTS, allow: "/", disallow: DISALLOW },
    BLOCK_TRAINING_BOTS
      ? { userAgent: TRAINING_BOTS, disallow: "/" }
      : { userAgent: TRAINING_BOTS, allow: "/", disallow: DISALLOW },
    { userAgent: "*", allow: "/", disallow: DISALLOW },
  ],
  sitemap: absoluteUrl("/sitemap.xml"),
});

export default robots;
