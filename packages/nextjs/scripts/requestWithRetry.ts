// The HTTP side of scripts/fetchTokenIcons.ts, apart so its retry rules are testable against a local server.

export type RequestOptions = {
  headers?: Record<string, string>;
  /** Statuses that mean the resource does not exist: the request resolves to null instead of failing. */
  goneStatuses?: readonly number[];
  attempts?: number;
  /** One budget for the response and reading its body. */
  timeoutMs?: number;
  /** After a timeout or a dropped connection. */
  networkRetryWaitMs?: number;
  /** After a 429 or a server error without a Retry-After header, which may ask for up to maxRateLimitWaitMs. */
  rateLimitWaitMs?: number;
  maxRateLimitWaitMs?: number;
  log?: (message: string) => void;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Transient failures: the TimeoutError of fetch's signal, and the TypeError undici throws for a failed or dropped
 * connection, which carries the socket or DNS error as its cause. A TypeError without a cause is a bad argument (a
 * header value with a stray character) or a bug in `read`, and retrying cannot fix either.
 */
const isNetworkError = (error: unknown): error is Error =>
  error instanceof Error &&
  (error.name === "TimeoutError" || (error instanceof TypeError && error.cause !== undefined));

/** The most specific description of a network error: the cause's code (ECONNRESET, ENOTFOUND, UND_ERR_SOCKET). */
const describeNetworkError = (error: Error) => {
  const cause = error.cause as { code?: string; message?: string } | undefined;
  return cause?.code ?? cause?.message ?? error.name;
};

/**
 * GETs a URL and reads the body with `read`. Retries a rate limit (429), a server error, a timeout or a dropped
 * connection; any other status fails at once.
 */
export const requestWithRetry = async <T>(
  url: string,
  read: (response: Response) => Promise<T>,
  {
    headers = {},
    goneStatuses = [404],
    attempts = 4,
    timeoutMs = 30_000,
    networkRetryWaitMs = 5_000,
    rateLimitWaitMs = 60_000,
    maxRateLimitWaitMs = 300_000,
    log = console.log,
  }: RequestOptions = {},
): Promise<T | null> => {
  for (let attempt = 1; ; attempt++) {
    let failure: string;
    let waitMs: number;
    let lastError: unknown;
    try {
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
      if (response.ok) return await read(response);
      if (goneStatuses.includes(response.status)) return null;
      if (response.status !== 429 && response.status < 500) {
        throw new Error(`GET ${url} failed: HTTP ${response.status}`);
      }
      const retryAfterSeconds = Number(response.headers.get("retry-after"));
      failure = `HTTP ${response.status}`;
      waitMs = retryAfterSeconds > 0 ? Math.min(retryAfterSeconds * 1000, maxRateLimitWaitMs) : rateLimitWaitMs;
    } catch (error) {
      if (!isNetworkError(error)) throw error;
      failure = describeNetworkError(error);
      waitMs = networkRetryWaitMs;
      lastError = error;
    }
    if (attempt >= attempts) {
      throw new Error(`GET ${url} failed ${attempts} times, last with ${failure}`, { cause: lastError });
    }
    log(`  ${failure} from ${new URL(url).hostname}, retrying in ${waitMs / 1000}s`);
    await sleep(waitMs);
  }
};
