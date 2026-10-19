// The logic of scripts/submitIndexNow.ts, apart so it is testable with a mocked fetch.
import { parseArgs } from "node:util";
import { INDEXNOW_KEY_PATH, isIndexNowKey } from "~~/utils/indexNow";

/**
 * The only site this script submits. Fixed here rather than read from NEXT_PUBLIC_SITE_URL, so a local env file
 * cannot point it anywhere else.
 */
export const SITE_ORIGIN = "https://tokenping.xyz";
export const SITEMAP_URL = `${SITE_ORIGIN}/sitemap.xml`;
export const KEY_LOCATION = `${SITE_ORIGIN}${INDEXNOW_KEY_PATH}`;

/**
 * IndexNow endpoints (https://www.indexnow.org/faq). Every participating engine shares what it receives with the
 * others, so one submission to api.indexnow.org reaches Bing, Seznam, Yandex and the rest.
 */
export const ENDPOINTS = {
  indexnow: "https://api.indexnow.org/indexnow",
  bing: "https://www.bing.com/indexnow",
  seznam: "https://search.seznam.cz/indexnow",
  yandex: "https://yandex.com/indexnow",
  naver: "https://searchadvisor.naver.com/indexnow",
  yep: "https://indexnow.yep.com/indexnow",
  amazon: "https://indexnow.amazonbot.amazon/indexnow",
} as const;

export type Engine = keyof typeof ENDPOINTS;

const isEngine = (name: string): name is Engine => Object.hasOwn(ENDPOINTS, name);

/** The protocol's limit per POST. */
export const MAX_URLS_PER_REQUEST = 10_000;

const TIMEOUT_MS = 30_000;

/**
 * What each refusal means, from the protocol's documentation and FAQ. Engines differ in the details (a key file they
 * cannot read is 403 at Bing and Seznam, 422 at Yep), so the log also prints the engine's own message.
 */
const STATUS_MEANINGS: Record<number, string> = {
  400: "bad request: the body is not in the protocol's format",
  403: "the key is not valid: the engine could not read the key file, or it holds another key",
  422: "not processed: a URL outside the host, a key in the wrong format, an unreadable key file or unchanged URLs sent again",
  429: "too many requests: wait, then send fewer URLs (changed pages only)",
};

export type SitemapEntry = { url: string; lastModified?: string };

const XML_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const unescapeXml = (text: string) => text.replace(/&(amp|lt|gt|quot|apos);/g, (_, name: string) => XML_ENTITIES[name]);

const tagText = (xml: string, tag: string) => {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? unescapeXml(match[1].trim()) : undefined;
};

/** The <url> entries of a sitemap as app/sitemap.ts renders it: one <loc> each, <lastmod> when the page has a date. */
export const parseSitemap = (xml: string): SitemapEntry[] =>
  [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].flatMap(([, entry]) => {
    const url = tagText(entry, "loc");
    const lastModified = tagText(entry, "lastmod");
    return url ? [{ url, ...(lastModified && { lastModified }) }] : [];
  });

/** True only for an https://tokenping.xyz/ URL: no other scheme, host, port or user info. */
export const isSiteUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.origin === SITE_ORIGIN && !parsed.username && !parsed.password && url.startsWith(`${SITE_ORIGIN}/`);
  } catch {
    return false;
  }
};

/** A real calendar day written YYYY-MM-DD. */
export const isIsoDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().startsWith(value);

/** Entries whose content date is on or after `since`. Pages without a date cannot show a change, so they are left out. */
export const changedSince = (entries: readonly SitemapEntry[], since: string) =>
  entries.filter(({ lastModified }) => lastModified !== undefined && lastModified.slice(0, 10) >= since);

export const batches = <T>(items: readonly T[], size = MAX_URLS_PER_REQUEST): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));

/** The JSON body of an IndexNow POST for a set of URLs. */
export const requestBody = (key: string, urlList: readonly string[]) => ({
  host: new URL(SITE_ORIGIN).host,
  key,
  keyLocation: KEY_LOCATION,
  urlList,
});

const USAGE = `Usage: yarn next:indexnow [--since YYYY-MM-DD] [--engine name] [--dry-run]

Submits the pages in ${SITEMAP_URL} to IndexNow with the key served at ${KEY_LOCATION}.
  --since YYYY-MM-DD  only pages whose sitemap date is on or after this day
  --engine name       ${Object.keys(ENDPOINTS).join(", ")} (default: indexnow, which shares with every engine)
  --dry-run           list the URLs without submitting them`;

type Options = { since?: string; engine: Engine; dryRun: boolean; help: boolean };

/** The command line as options, or the message that explains what is wrong with it. */
export const parseOptions = (argv: readonly string[]): Options | string => {
  try {
    // parseArgs throws for an unknown option or a positional argument.
    const { values } = parseArgs({
      args: [...argv],
      options: {
        since: { type: "string" },
        engine: { type: "string" },
        "dry-run": { type: "boolean" },
        help: { type: "boolean", short: "h" },
      },
      strict: true,
      allowPositionals: false,
    });
    const { since, engine = "indexnow", "dry-run": dryRun = false, help = false } = values;
    if (since !== undefined && !isIsoDate(since)) return `--since takes a day written YYYY-MM-DD, not "${since}"`;
    if (!isEngine(engine)) return `Unknown engine "${engine}". Choose one of: ${Object.keys(ENDPOINTS).join(", ")}`;
    return { since, engine, dryRun, help };
  } catch (cause) {
    return `${(cause as Error).message}\n\n${USAGE}`;
  }
};

/** The response body on one line, for the log: engines put the reason for a refusal there. */
const bodySummary = async (response: Response) => {
  const text = (await response.text().catch(() => "")).replace(/\s+/g, " ").trim();
  return text.length > 200 ? `${text.slice(0, 200)}...` : text;
};

export type RunOptions = {
  fetch?: typeof fetch;
  log?: (message: string) => void;
  error?: (message: string) => void;
};

/**
 * Reads the live key file and sitemap, then POSTs the sitemap's URLs to IndexNow in batches. Resolves to the process
 * exit code: 0 when every batch was accepted (200 or 202) or there was nothing to send, 1 otherwise.
 */
export const run = async (
  argv: readonly string[],
  { fetch: fetchImpl = fetch, log = console.log, error = console.error }: RunOptions = {},
): Promise<number> => {
  const options = parseOptions(argv);
  if (typeof options === "string") {
    error(options);
    return 1;
  }
  if (options.help) {
    log(USAGE);
    return 0;
  }
  const { since, engine, dryRun } = options;
  const endpoint = ENDPOINTS[engine];
  const get = (url: string) => fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });

  try {
    // The live site, not this checkout: the engines check the deployed key file, and only deployed pages should go out.
    const keyResponse = await get(KEY_LOCATION);
    const key = keyResponse.ok ? (await keyResponse.text()).trim() : "";
    const keyProblem = !keyResponse.ok
      ? `${KEY_LOCATION} answered HTTP ${keyResponse.status}. Set INDEXNOW_KEY in Vercel and redeploy first.`
      : !isIndexNowKey(key)
        ? `${KEY_LOCATION} does not hold an IndexNow key (8 to 128 letters, digits or dashes).`
        : undefined;
    if (keyProblem && !dryRun) {
      error(keyProblem);
      return 1;
    }

    const sitemapResponse = await get(SITEMAP_URL);
    if (!sitemapResponse.ok) {
      error(`${SITEMAP_URL} answered HTTP ${sitemapResponse.status}`);
      return 1;
    }
    const entries = parseSitemap(await sitemapResponse.text());
    if (entries.length === 0) {
      error(`${SITEMAP_URL} lists no URLs`);
      return 1;
    }
    const foreign = entries.filter(({ url }) => !isSiteUrl(url));
    if (foreign.length > 0) {
      error(
        [
          `Nothing was sent: the sitemap lists URLs outside ${SITE_ORIGIN}/ (check NEXT_PUBLIC_SITE_URL in Vercel):`,
          ...foreign.map(({ url }) => `  ${url}`),
        ].join("\n"),
      );
      return 1;
    }

    const urls = (since === undefined ? entries : changedSince(entries, since)).map(({ url }) => url);
    if (since !== undefined) {
      const undated = entries.filter(({ lastModified }) => lastModified === undefined).length;
      log(`${urls.length} of ${entries.length} sitemap URLs changed on or after ${since}.`);
      if (undated > 0) log(`${undated} pages have no date in the sitemap, so only a run without --since sends them.`);
    }
    if (urls.length === 0) {
      log("Nothing to submit.");
      return 0;
    }
    if (dryRun) {
      log(`Dry run: would send ${urls.length} URLs to ${endpoint} with the key from ${KEY_LOCATION}:`);
      for (const url of urls) log(`  ${url}`);
      if (!keyProblem) return 0;
      error(`${keyProblem} A real run would stop there.`);
      return 1;
    }

    const parts = batches(urls);
    for (const [index, urlList] of parts.entries()) {
      const label = `Batch ${index + 1} of ${parts.length} (${urlList.length} URLs) to ${new URL(endpoint).host}`;
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(requestBody(key, urlList)),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const summary = await bodySummary(response);
      const details = summary ? `. ${summary}` : "";
      if (response.status === 200 || response.status === 202) {
        const note = response.status === 202 ? "received; the engine still has to fetch and check the key" : "accepted";
        log(`${label}: HTTP ${response.status}, ${note}${details}`);
        continue;
      }
      const retryAfter = response.headers.get("retry-after");
      error(
        `${label}: HTTP ${response.status}, ${STATUS_MEANINGS[response.status] ?? "not accepted"}` +
          `${retryAfter ? ` (Retry-After: ${retryAfter})` : ""}${details}`,
      );
      if (index < parts.length - 1) error(`Stopped: ${parts.length - index - 1} batches were not sent.`);
      return 1;
    }
    return 0;
  } catch (cause) {
    const reason = cause instanceof Error ? `${cause.message}${cause.cause ? ` (${String(cause.cause)})` : ""}` : cause;
    error(`IndexNow submission failed: ${reason}`);
    return 1;
  }
};
