import { describe, expect, it } from "vitest";
import robots from "~~/app/robots";

describe("robots", () => {
  const { rules, sitemap } = robots();
  const groups = Array.isArray(rules) ? rules : [rules];

  it("points crawlers at the production sitemap", () => {
    expect(sitemap).toBe("https://tokenping.xyz/sitemap.xml");
  });

  it("allows search and AI retrieval bots", () => {
    const retrieval = groups.find(({ userAgent }) => Array.isArray(userAgent) && userAgent.includes("OAI-SearchBot"));

    expect(retrieval?.userAgent).toEqual(
      expect.arrayContaining(["Googlebot", "bingbot", "Applebot", "Claude-SearchBot", "Claude-User", "PerplexityBot"]),
    );
    expect(retrieval?.allow).toBe("/");
  });

  it("allows training bots by default (a founder decision)", () => {
    const training = groups.find(({ userAgent }) => Array.isArray(userAgent) && userAgent.includes("GPTBot"));

    expect(training?.userAgent).toEqual(expect.arrayContaining(["ClaudeBot", "Google-Extended", "CCBot"]));
    expect(training?.allow).toBe("/");
  });

  // A crawler obeys only the most specific group naming it, so a disallow in "*" alone would not reach named bots.
  it("repeats Disallow: /api/ in every group", () => {
    expect(groups).toHaveLength(3);
    for (const group of groups) expect(group.disallow).toEqual(["/api/"]);
    expect(groups.at(-1)?.userAgent).toBe("*");
  });

  it("does not disallow the dev routes, which 404 instead (a disallowed URL can still be indexed bare)", () => {
    expect(JSON.stringify(rules)).not.toMatch(/debug|blockexplorer|admin/);
  });
});
