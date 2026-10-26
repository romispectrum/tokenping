import { AGENT_SKILLS_HEADERS, buildMorphoAlertsSkill } from "~~/utils/agentSkills";

// The Morpho skill the agent skills index lists (utils/agentSkills.ts). Its digest in the index is taken from this text.
export const dynamic = "force-static";

export const GET = () =>
  new Response(buildMorphoAlertsSkill(), {
    headers: { ...AGENT_SKILLS_HEADERS, "Content-Type": "text/markdown; charset=utf-8" },
  });
