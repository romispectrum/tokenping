import { describe, expect, it } from "vitest";
import { GET } from "~~/app/robots.txt/route";
import { CONTENT_SIGNAL, buildRobotsTxt } from "~~/utils/robots";

const text = buildRobotsTxt();
/** Each blank-line separated block that names a user agent, as its lines. */
const groups = text
  .split("\n\n")
  .map(block => block.split("\n").filter(Boolean))
  .filter(lines => lines.some(line => line.startsWith("User-Agent: ")));
const agentsOf = (lines: string[]) =>
  lines.filter(line => line.startsWith("User-Agent: ")).map(line => line.slice("User-Agent: ".length));
const groupNaming = (agent: string) => groups.find(lines => agentsOf(lines).includes(agent));

describe("robots.txt", () => {
  it("points crawlers at the production sitemap", () => {
    expect(text.trimEnd().split("\n").at(-1)).toBe("Sitemap: https://tokenping.xyz/sitemap.xml");
  });

  it("allows search and AI retrieval bots", () => {
    const retrieval = groupNaming("OAI-SearchBot")!;

    expect(agentsOf(retrieval)).toEqual(
      expect.arrayContaining(["Googlebot", "bingbot", "Applebot", "Claude-SearchBot", "Claude-User", "PerplexityBot"]),
    );
    expect(retrieval).toContain("Allow: /");
  });

  it("shuts the training bots out of the whole site (a founder decision)", () => {
    const training = groupNaming("GPTBot")!;

    expect(agentsOf(training)).toEqual(expect.arrayContaining(["ClaudeBot", "Google-Extended", "CCBot"]));
    expect(training.filter(line => /^(Allow|Disallow): /.test(line))).toEqual(["Disallow: /"]);
    // A search or answer crawler is never in the training group.
    for (const agent of ["Googlebot", "bingbot", "OAI-SearchBot", "Claude-SearchBot", "PerplexityBot"])
      expect(agentsOf(training)).not.toContain(agent);
  });

  // A crawler obeys only the most specific group naming it, so a line in "*" alone would not reach named bots.
  it("repeats Disallow: /api/ and the content signal in every group that may crawl", () => {
    expect(groups).toHaveLength(3);
    for (const lines of groups) expect(lines).toContain(`Content-Signal: ${CONTENT_SIGNAL}`);
    for (const lines of [groups[0], groups[2]])
      expect(lines.filter(line => line.startsWith("Disallow: "))).toEqual(["Disallow: /api/"]);
    expect(agentsOf(groups.at(-1)!)).toEqual(["*"]);
  });

  // AI answers that cite Tokenping are the goal, so ai-input must never be no; ai-train matches the training group.
  it("signals search and AI input as allowed and training as not", () => {
    expect(CONTENT_SIGNAL).toBe("search=yes, ai-input=yes, ai-train=no");
  });

  it("puts each group's User-Agent lines first, then the signal, then the rules", () => {
    for (const lines of groups) {
      const agents = agentsOf(lines).length;
      expect(lines[agents]).toMatch(/^Content-Signal: /);
      expect(lines.slice(agents + 1).every(line => /^(Allow|Disallow): /.test(line))).toBe(true);
    }
  });

  it("does not disallow the dev routes, which 404 instead (a disallowed URL can still be indexed bare)", () => {
    expect(text).not.toMatch(/debug|blockexplorer|admin/);
  });

  it("is served as plain text, the same file", async () => {
    const response = GET();
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await response.text()).toBe(text);
  });
});
