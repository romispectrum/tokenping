import { describe, expect, it } from "vitest";
import { GET as getAiCatalog } from "~~/app/.well-known/ai-catalog.json/route";
import { GET as getArd } from "~~/app/.well-known/ard.json/route";
import {
  AAVE_ALERTS_SKILL_DESCRIPTION,
  MORPHO_ALERTS_SKILL_DESCRIPTION,
  aaveAlertsSkillPath,
  buildAgentSkillsIndex,
  morphoAlertsSkillPath,
} from "~~/utils/agentSkills";
import { buildArdManifest } from "~~/utils/ard";

const manifest = buildArdManifest();
const [entry, morphoEntry] = manifest.entries;

describe("ARD manifest", () => {
  it("has a spec version, a host and an entry per agent skill: Aave's, then Morpho's", () => {
    expect(manifest.specVersion).toBe("1.0");
    expect(manifest.host).toEqual({ displayName: "Tokenping", identifier: "https://tokenping.xyz/#organization" });
    expect(manifest.entries).toHaveLength(2);
    expect(morphoEntry.identifier).toBe("urn:air:tokenping.xyz:skill:morpho-health-factor-alerts");
    expect(morphoEntry.displayName).toBe("Morpho health factor alerts");
  });

  it("gives the entry a urn:air identifier on the site's domain, a name, a media type and exactly one of url or data", () => {
    expect(entry.identifier).toBe("urn:air:tokenping.xyz:skill:aave-health-factor-alerts");
    expect(entry.identifier).toMatch(/^urn:air:[a-z0-9.-]+:[a-z0-9-]+:[a-z0-9-]+$/);
    expect(entry.displayName).toBeTruthy();
    expect(entry.type).toBe("application/agent-skills+md");
    expect(Object.keys(entry).filter(key => key === "url" || key === "data")).toEqual(["url"]);
  });

  it("lists the agent skills the skills index lists: same files, same descriptions", () => {
    const [skill, morphoSkill] = buildAgentSkillsIndex().skills;

    expect(entry.url).toBe(`https://tokenping.xyz${aaveAlertsSkillPath()}`);
    expect(entry.url.endsWith(skill.url)).toBe(true);
    expect(entry.description).toBe(AAVE_ALERTS_SKILL_DESCRIPTION);
    expect(entry.description).toBe(skill.description);
    expect(morphoEntry.url).toBe(`https://tokenping.xyz${morphoAlertsSkillPath()}`);
    expect(morphoEntry.url.endsWith(morphoSkill.url)).toBe(true);
    expect(morphoEntry.description).toBe(MORPHO_ALERTS_SKILL_DESCRIPTION);
  });

  it("gives two to five example queries a person would actually ask, about that skill's protocol", () => {
    for (const [each, protocol] of [
      [entry, /Aave/],
      [morphoEntry, /Morpho/],
    ] as const) {
      expect(each.representativeQueries.length).toBeGreaterThanOrEqual(2);
      expect(each.representativeQueries.length).toBeLessThanOrEqual(5);
      for (const query of each.representativeQueries) expect(query).toMatch(protocol);
    }
  });

  it("uses no em or en dashes and never the banned words", () => {
    const text = JSON.stringify(manifest);

    expect(text).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
    expect(text).not.toMatch(/\bfree\b|zdarma|bezplatn|real-time|\binstant|never get liquidated/i);
  });
});

describe.each([
  ["/.well-known/ard.json", getArd],
  ["/.well-known/ai-catalog.json", getAiCatalog],
])("%s", (_path, GET) => {
  it("is served as JSON that any page may fetch", async () => {
    const response = GET();

    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(await response.json()).toEqual(manifest);
  });
});
