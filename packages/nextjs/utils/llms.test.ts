import { describe, expect, it } from "vitest";
import { GET } from "~~/app/llms.txt/route";
import { getPublishedPosts, hubSlug } from "~~/content/blog";
import { LOCALES } from "~~/i18n/locales";
import { postPath } from "~~/i18n/routes";
import { AAVE_ALERTS_SKILL_DESCRIPTION, aaveAlertsSkillPath } from "~~/utils/agentSkills";
import { buildLlmsTxt } from "~~/utils/llms";

const text = buildLlmsTxt();
const lines = text.split("\n");
const section = (heading: string) => {
  const start = lines.indexOf(`## ${heading}`);
  const end = lines.findIndex((line, index) => index > start && line.startsWith("## "));
  return lines.slice(start + 1, end === -1 ? undefined : end).filter(Boolean);
};

describe("llms.txt", () => {
  it("follows the llms.txt layout: H1, a summary quote, plain details, then H2 link lists ending with Optional", () => {
    expect(lines[0]).toBe("# Tokenping");
    expect(lines[2]).toMatch(
      /^> Tokenping sends a message when an Aave V3, Aave V4, Morpho Blue or Morpho Midnight health factor drops/,
    );
    const headings = lines.filter(line => line.startsWith("#"));
    expect(headings).toEqual([
      "# Tokenping",
      "## Pages",
      "## Guides",
      "## Czech",
      "## Spanish",
      "## Hindi",
      "## German",
      "## Vietnamese",
      "## Optional",
    ]);
    // Everything under an H2 is a link list item: "- [name](url)" with optional ": notes".
    for (const heading of ["Pages", "Guides", "Czech", "Spanish", "Hindi", "German", "Vietnamese", "Optional"]) {
      for (const line of section(heading))
        expect(line).toMatch(/^- \[[^\]]+\]\(https:\/\/tokenping\.xyz\/[^)]*\)(: .+)?$/);
    }
  });

  it("states the product facts from the site's own constants", () => {
    expect(text).toMatch(/- Checks: every \d+ minutes/);
    expect(text).toMatch(/threshold its owner chose \(1\.1 to 10 on Aave, 1\.02 to 10 on Morpho\)/);
    expect(text).toMatch(/every Aave V3 market \(\d+ markets on \d+ networks\) and every Aave V4 Spoke \(\d+\)/);
    expect(text).toMatch(
      /- Morpho coverage: every Morpho Blue \(variable-rate\) and Morpho Midnight \(fixed-rate\) market/,
    );
    expect(text).toContain("](https://tokenping.xyz/morpho): ");
    expect(text).toContain(
      "[Agent skill: Morpho health factor alerts](https://tokenping.xyz/.well-known/agent-skills/",
    );
    expect(text).toContain(
      "Nothing renews automatically; each payment adds one plan period after the current end date.",
    );
    expect(text).toContain("Independent tool, not affiliated with Aave Labs, the Aave DAO or Morpho.");
    // The price lives on chain and in the paywall: never written into a static file.
    expect(text).not.toMatch(/\d+(\.\d+)? USDC/);
  });

  it.each(LOCALES)("lists every published %s guide once, with its title, absolute link and description", locale => {
    const posts = getPublishedPosts(locale);
    for (const { meta } of posts) {
      const line = `- [${meta.title}](https://tokenping.xyz${postPath(locale, meta.slug)}): ${meta.description}`;
      expect(lines.filter(other => other === line)).toHaveLength(1);
    }
  });

  it("lists the hub first, then the other guides latest first, as the blog page does", () => {
    const guides = section("Guides");
    expect(guides[0]).toContain(`(https://tokenping.xyz${postPath("en", hubSlug("en"))})`);
    const dates = guides.slice(1).map(line => {
      const slug = line.match(/\/blog\/([^)]+)\)/)?.[1];
      return getPublishedPosts("en").find(({ meta }) => meta.slug === slug)?.meta.publishedAt ?? "";
    });
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("lists the agent skill under Optional, with the description the skills index gives it", () => {
    expect(section("Optional")).toContain(
      `- [Agent skill: Aave health factor alerts](https://tokenping.xyz${aaveAlertsSkillPath()}): ${AAVE_ALERTS_SKILL_DESCRIPTION}`,
    );
  });

  it("links the Czech pages under /cz in the Czech section", () => {
    const czech = section("Czech");
    expect(czech[0]).toMatch(/^- \[Tokenping\]\(https:\/\/tokenping\.xyz\/cz\): /);
    expect(czech.every(line => line.includes("(https://tokenping.xyz/cz"))).toBe(true);
  });

  it("links the Spanish pages and every Spanish guide under /es in the Spanish section", () => {
    const spanish = section("Spanish");
    expect(spanish[0]).toMatch(/^- \[Tokenping\]\(https:\/\/tokenping\.xyz\/es\): /);
    expect(spanish.every(line => line.includes("(https://tokenping.xyz/es"))).toBe(true);
    expect(spanish.filter(line => line.includes("(https://tokenping.xyz/es/blog/"))).toHaveLength(
      getPublishedPosts("es").length,
    );
  });

  it("links the Hindi pages and every Hindi guide under /hi in the Hindi section", () => {
    const hindi = section("Hindi");
    expect(hindi[0]).toMatch(/^- \[Tokenping\]\(https:\/\/tokenping\.xyz\/hi\): /);
    expect(hindi.every(line => line.includes("(https://tokenping.xyz/hi"))).toBe(true);
    expect(hindi.filter(line => line.includes("(https://tokenping.xyz/hi/blog/"))).toHaveLength(
      getPublishedPosts("hi").length,
    );
  });

  it.each([
    ["German", "de"],
    ["Vietnamese", "vi"],
  ] as const)("links the %s pages and every %s guide under its prefix in its section", (heading, locale) => {
    const lines = section(heading);
    expect(lines[0]).toMatch(new RegExp(`^- \\[Tokenping\\]\\(https://tokenping\\.xyz/${locale}\\): `));
    expect(lines.every(line => line.includes(`(https://tokenping.xyz/${locale}`))).toBe(true);
    expect(lines.filter(line => line.includes(`(https://tokenping.xyz/${locale}/blog/`))).toHaveLength(
      getPublishedPosts(locale).length,
    );
  });

  it("uses no em or en dashes and never the banned words", () => {
    expect(text).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
    expect(text).not.toMatch(/\bfree\b|zdarma|bezplatn/i);
  });

  it("is served as plain text, the same file", async () => {
    const response = GET();
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await response.text()).toBe(text);
  });
});
