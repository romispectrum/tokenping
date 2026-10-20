import { AGENT_SKILLS_HEADERS, buildAgentSkillsIndex } from "~~/utils/agentSkills";

// The agent skills discovery index (utils/agentSkills.ts). Built once per deployment, like llms.txt.
export const dynamic = "force-static";

export const GET = () =>
  new Response(JSON.stringify(buildAgentSkillsIndex(), null, 2), {
    headers: { ...AGENT_SKILLS_HEADERS, "Content-Type": "application/json" },
  });
