import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { GET as getSkill } from "~~/app/.well-known/agent-skills/aave-health-factor-alerts/SKILL.md/route";
import { GET as getIndex } from "~~/app/.well-known/agent-skills/index.json/route";
import { getPublishedPosts } from "~~/content/blog";
import { postPath } from "~~/i18n/routes";
import {
  AAVE_ALERTS_SKILL_DESCRIPTION,
  AAVE_ALERTS_SKILL_NAME,
  AGENT_SKILLS_SCHEMA,
  aaveAlertsSkillPath,
  buildAaveAlertsSkill,
  buildAgentSkillsIndex,
} from "~~/utils/agentSkills";

const skill = buildAaveAlertsSkill();
const [entry] = buildAgentSkillsIndex().skills;

describe("agent skills index", () => {
  it("names the v0.2.0 schema and lists one skill-md entry with every required field", () => {
    const index = buildAgentSkillsIndex();

    expect(index.$schema).toBe(AGENT_SKILLS_SCHEMA);
    expect(index.skills).toHaveLength(1);
    expect(entry).toEqual({
      name: AAVE_ALERTS_SKILL_NAME,
      type: "skill-md",
      description: AAVE_ALERTS_SKILL_DESCRIPTION,
      url: "/.well-known/agent-skills/aave-health-factor-alerts/SKILL.md",
      digest: expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
    });
  });

  it("follows the RFC's limits on the name and the description", () => {
    expect(entry.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(entry.name.length).toBeLessThanOrEqual(64);
    expect(entry.description.length).toBeLessThanOrEqual(1024);
    expect(entry.url).toBe(aaveAlertsSkillPath());
  });

  it("takes the digest from the bytes the skill route serves", async () => {
    const served = await getSkill().text();

    expect(entry.digest).toBe(`sha256:${createHash("sha256").update(served, "utf8").digest("hex")}`);
  });

  it("is served as JSON that any page may fetch", async () => {
    const response = getIndex();

    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(await response.json()).toEqual(buildAgentSkillsIndex());
  });
});

describe("the aave-health-factor-alerts skill", () => {
  it("opens with frontmatter that repeats the index entry's name and description", () => {
    const [open, name, description, close] = skill.split("\n");

    expect([open, close]).toEqual(["---", "---"]);
    expect(name).toBe(`name: ${entry.name}`);
    expect(description).toBe(`description: ${entry.description}`);
  });

  it("is served as markdown that any page may fetch", async () => {
    const response = getSkill();

    expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(await response.text()).toBe(skill);
  });

  it("states the product facts from the site's own constants", () => {
    expect(skill).toContain("accepts 1.1 to 10, 1.5 by default");
    expect(skill).toMatch(/checks are 5 minutes apart/);
    expect(skill).toMatch(
      /Every Aave V3 market \(\d+ markets on \d+ networks\) and every Aave V4 Spoke \(\d+\), \d+ networks in all/,
    );
    expect(skill).toContain("Independent tool, not affiliated with Aave Labs or the Aave DAO.");
    // The price lives on chain and in the paywall: never written into a static file.
    expect(skill).not.toMatch(/\d+(\.\d+)? USDC/);
  });

  it("links the guides it relies on, each a published English post", () => {
    const links = [...skill.matchAll(/\]\((https:\/\/tokenping\.xyz\/blog\/[^)]+)\)/g)].map(([, url]) => url);
    const published = getPublishedPosts("en").map(({ meta }) => `https://tokenping.xyz${postPath("en", meta.slug)}`);

    expect(links).toHaveLength(5);
    for (const url of links) expect(published).toContain(url);
  });

  it("tells the assistant what it cannot do and what to warn about", () => {
    expect(skill).toContain("You cannot connect a wallet or pay for them.");
    expect(skill).toContain("never asks for a seed phrase or a private key");
    expect(skill).toContain("not financial advice");
    expect(skill).toMatch(/does not prevent a liquidation/);
  });

  it("points at the comparison, so Tokenping is not the only answer it gives", () => {
    expect(skill).toContain("## Other tools");
    expect(skill).toMatch(
      /where Tokenping is the wrong choice: \[[^\]]+\]\(https:\/\/tokenping\.xyz\/blog\/aave-liquidation-alert-tools\)/,
    );
  });

  it("uses no em or en dashes and never the banned words", () => {
    expect(skill).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
    expect(skill).not.toMatch(/\bfree\b|zdarma|bezplatn|real-time|\binstant|never get liquidated/i);
  });
});
