import { buildRobotsTxt } from "~~/utils/robots";

// The site's robots.txt (utils/robots.ts), as a route because it carries Content-Signal lines. Built once per
// deployment.
export const dynamic = "force-static";

export const GET = () => new Response(buildRobotsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
