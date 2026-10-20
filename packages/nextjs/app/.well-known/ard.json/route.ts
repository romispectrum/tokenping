import { AGENT_SKILLS_HEADERS } from "~~/utils/agentSkills";
import { buildArdManifest } from "~~/utils/ard";

// The ARD manifest (utils/ard.ts) at the current spec's path; ../ai-catalog.json/route.ts serves it at the old one.
// Built once per deployment, like llms.txt.
export const dynamic = "force-static";

export const GET = () =>
  new Response(JSON.stringify(buildArdManifest(), null, 2), {
    headers: { ...AGENT_SKILLS_HEADERS, "Content-Type": "application/json" },
  });
