import { buildLlmsTxt } from "~~/utils/llms";

// The site's llms.txt (utils/llms.ts). Built once per deployment, like the RSS feeds, so a new guide shows up with the
// next deploy.
export const dynamic = "force-static";

export const GET = () => new Response(buildLlmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
