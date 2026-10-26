import { existsSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "~~/app/indexnow-key.txt/route";
import { INDEXNOW_KEY_PATH } from "~~/utils/indexNow";
import { buildRobotsTxt } from "~~/utils/robots";

const KEY = "0123456789abcdef0123456789abcdef";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("GET /indexnow-key.txt", () => {
  it("serves the key alone as UTF-8 text", async () => {
    vi.stubEnv("INDEXNOW_KEY", KEY);
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await response.text()).toBe(KEY);
  });

  it("drops the whitespace a pasted value can carry", async () => {
    vi.stubEnv("INDEXNOW_KEY", ` ${KEY}\n`);

    expect(await GET().text()).toBe(KEY);
  });

  it("answers 404 with no body while INDEXNOW_KEY is not set", async () => {
    vi.stubEnv("INDEXNOW_KEY", undefined);
    const response = GET();

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
  });

  it("answers 404 for an empty INDEXNOW_KEY", () => {
    vi.stubEnv("INDEXNOW_KEY", "");

    expect(GET().status).toBe(404);
  });

  it("answers 404 and logs why for a value the protocol would refuse", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("INDEXNOW_KEY", "not a key!");
    const response = GET();

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining("INDEXNOW_KEY"));
    expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining("not a key!"));
  });

  it("lives at the path that submissions name as keyLocation", () => {
    expect(existsSync(new URL(`..${INDEXNOW_KEY_PATH}/route.ts`, import.meta.url))).toBe(true);
  });

  // The engines fetch the key file before they trust a submission; a robots.txt Disallow would hide it from them. Bing
  // reads bingbot's group, Yandex and Seznam the "*" one; the training crawlers' group shuts them out of everything.
  it("is not disallowed for the IndexNow engines' crawlers", () => {
    const groups = buildRobotsTxt()
      .split("\n\n")
      .map(block => block.split("\n"));
    for (const agent of ["bingbot", "*"]) {
      const group = groups.find(lines => lines.includes(`User-Agent: ${agent}`))!;
      const disallowed = group
        .filter(line => line.startsWith("Disallow: "))
        .map(line => line.slice("Disallow: ".length));

      expect(
        disallowed.filter(path => INDEXNOW_KEY_PATH.startsWith(path)),
        agent,
      ).toEqual([]);
    }
  });
});
