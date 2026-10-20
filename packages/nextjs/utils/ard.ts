// The ARD manifest (Agentic Resource Discovery, https://agenticresourcediscovery.org): a list of the agent resources
// the site publishes. Tokenping publishes one, the agent skill of utils/agentSkills.ts; it has no MCP server, A2A agent
// or API to list, and an entry for something it does not run would only send agents to errors.
import { AAVE_ALERTS_SKILL_DESCRIPTION, AAVE_ALERTS_SKILL_NAME, aaveAlertsSkillPath } from "~~/utils/agentSkills";
import { ORGANIZATION_ID, SITE_NAME, SITE_URL, absoluteUrl } from "~~/utils/seo";

// The current spec reads /.well-known/ard.json; /.well-known/ai-catalog.json is its predecessor's path, which consumers
// and scanners may still ask for. Both serve this manifest (app/.well-known).

/** The data model's version (the ai-catalog one the manifest follows), not the ARD spec's. */
const SPEC_VERSION = "1.0";

/** The agent skill media type of the ARD spec; the skill file itself is served as text/markdown. */
const AGENT_SKILL_MEDIA_TYPE = "application/agent-skills+md";

const REPRESENTATIVE_QUERIES = [
  "how do I get an alert when my Aave health factor drops",
  "what health factor should I set an alert at on Aave",
  "how do I avoid being liquidated on Aave",
  "what does an Aave health factor of 1.2 mean",
];

export const buildArdManifest = () => ({
  specVersion: SPEC_VERSION,
  // A stable identifier the site already publishes and that resolves: the Organization of its JSON-LD.
  host: { displayName: SITE_NAME, identifier: ORGANIZATION_ID },
  entries: [
    {
      identifier: `urn:air:${new URL(SITE_URL).hostname}:skill:${AAVE_ALERTS_SKILL_NAME}`,
      displayName: "Aave health factor alerts",
      description: AAVE_ALERTS_SKILL_DESCRIPTION,
      type: AGENT_SKILL_MEDIA_TYPE,
      url: absoluteUrl(aaveAlertsSkillPath()),
      representativeQueries: REPRESENTATIVE_QUERIES,
    },
  ],
});
