// @vitest-environment jsdom
import { notifyManager } from "@tanstack/react-query";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { UserRejectedRequestError, getAddress } from "viem";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationConfig } from "~~/components/custom/NotificationConfig";
import { markAttributionPrompted } from "~~/components/custom/notifications/attributionPromptState";
import { useNotificationConfig } from "~~/hooks/custom/useNotificationConfig";
import { LocaleProvider } from "~~/i18n/LocaleProvider";
import type { Locale } from "~~/i18n/locales";
import { notificationConfigClient } from "~~/services/notifications/notificationConfigClient";
import type { NotificationConfig as NotificationConfigType } from "~~/types/notifications";
import { deferred, jsonResponse } from "~~/utils/testing/helpers";
import { renderWithProviders } from "~~/utils/testing/providers";

/*
 * The notification settings card against its real hooks and API clients, with a small in-memory API behind a mocked
 * `fetch`. Timers are fake so the Telegram username check (the typing pause, the retry and the polling) and the test
 * message cooldown can be stepped through.
 */

const mocks = vi.hoisted(() => ({
  address: undefined as string | undefined,
  chainId: undefined as number | undefined,
  hasAccess: true,
  toasts: [] as string[],
  wagmiConfig: {},
  /** The wallet's signature prompt (wagmi's signMessageAsync). */
  signMessage: vi.fn<(args: { account: string; message: string }) => Promise<string>>(),
}));

// useAccount and getAccount read the same wagmi state: the connected wallet.
vi.mock("wagmi", () => ({
  useAccount: () => ({ address: mocks.address, chainId: mocks.chainId }),
  useConfig: () => mocks.wagmiConfig,
  useSignMessage: () => ({ signMessageAsync: mocks.signMessage }),
}));
vi.mock("wagmi/actions", () => ({ getAccount: () => ({ address: mocks.address }) }));
vi.mock("~~/hooks/custom/useAccess", () => ({ useAccess: () => ({ isActive: mocks.hasAccess }) }));
vi.mock("~~/utils/scaffold-eth", () => ({
  notification: {
    success: (message: string) => mocks.toasts.push(`success: ${message}`),
    error: (message: string) => mocks.toasts.push(`error: ${message}`),
  },
}));

const ADDRESS = "0xAbCdEf0000000000000000000000000000000001";
const OTHER_ADDRESS = "0x1234500000000000000000000000000000000002";
const CHAIN_ID = 42161;
const MARKET = "v3";
/** The key the config API lists a market's config under. */
const MARKET_KEY = `${CHAIN_ID}:${MARKET}`;
const NOW = Date.parse("2026-10-14T12:00:00.000Z");
/** The Telegram bot people press Start in. */
const BOT = "TokenpingTestBot";

const SAVED_CONFIG = {
  chainId: CHAIN_ID,
  market: MARKET,
  enabled: true,
  services: ["email", "signal", "telegram"],
  healthFactorThreshold: 1.8,
  email: "saved@example.com",
  signalRecipient: "saved.01",
  telegramUsername: "saved_tg",
};

type Call = { method: string; url: string; body?: Record<string, unknown> };

const TEST_COOLDOWN_MS = 15 * 60_000;

/**
 * In-memory API state, keyed by lowercased wallet. `session` is the wallet of the session cookie: the alert routes act
 * for it and answer 401 without one, like the server. `override` answers a request instead (failures, slow responses).
 */
const api = {
  session: null as string | null,
  configs: {} as Record<string, Record<string, unknown>>,
  /** The Telegram usernames that have pressed Start in the bot. */
  linked: new Set<string>(),
  attribution: {} as Record<string, unknown>,
  /** When each wallet's next test message per channel is allowed (ISO), as the server's notification_test_sends. */
  testRetryTimes: {} as Record<string, Record<string, string>>,
  requests: [] as string[],
  override: (() => undefined) as (call: Call) => Response | Promise<Response> | undefined,
};

const NONCE = "0123456789abcdef0123456789abcdef";
const SIGNATURE = "0x5167";

const SIGNED_OUT_PATHS = ["/api/notifications/config", "/api/notifications/test", "/api/attribution"];

const route = ({ method, url, body }: Call) => {
  const path = url.split("?")[0];
  if (path === "/api/auth/session" && method === "GET") return jsonResponse({ address: api.session });
  if (path === "/api/auth/nonce" && method === "POST") {
    return jsonResponse({ nonce: NONCE, issuedAt: new Date(Date.now()).toISOString() });
  }
  if (path === "/api/auth/verify" && method === "POST") {
    // The signer is the message's address line; the real route also checks the signature, site and nonce.
    const signer =
      String(body?.message)
        .match(/\n(0x[0-9a-fA-F]{40})\n/)?.[1]
        .toLowerCase() ?? null;
    api.session = signer;
    return jsonResponse({ address: signer });
  }
  if (path === "/api/auth/logout" && method === "POST") {
    api.session = null;
    return jsonResponse({ success: true });
  }
  if (SIGNED_OUT_PATHS.includes(path) && !api.session) {
    return jsonResponse({ error: "Sign in with your wallet first" }, 401);
  }
  const user = api.session ?? "";
  if (path === "/api/notifications/config") {
    if (method === "GET") return jsonResponse(api.configs[user] ?? {});
    const chainId = Number(body?.chainId);
    // Like the server: keyed by chain and market, "v3" when the body has none.
    const market = String(body?.market ?? "v3");
    const key = `${chainId}:${market}`;
    if (method === "PUT") {
      const { enabled, services, healthFactorThreshold, email, signalRecipient, telegramUsername, channelLocales } =
        body ?? {};
      const config = { chainId, market, enabled, services, healthFactorThreshold };
      api.configs[user] = {
        ...api.configs[user],
        [key]: {
          ...config,
          ...(email ? { email } : {}),
          ...(signalRecipient ? { signalRecipient } : {}),
          ...(telegramUsername ? { telegramUsername } : {}),
          // The client sends a language for each selected channel only, which is what the server lists back.
          ...(channelLocales ? { channelLocales } : {}),
        },
      };
    }
    if (method === "DELETE") delete api.configs[user]?.[key];
    return jsonResponse({ success: true });
  }
  if (path === "/api/notifications/test") {
    if (method === "GET") {
      // Like the server: a channel's time only while it is still in the future, null otherwise.
      const stored = api.testRetryTimes[user] ?? {};
      const retryAt = (channel: string) =>
        stored[channel] && Date.parse(stored[channel]) > Date.now() ? stored[channel] : null;
      return jsonResponse({ email: retryAt("email"), signal: retryAt("signal"), telegram: retryAt("telegram") });
    }
    const channel = String(body?.channel);
    const blocked = api.testRetryTimes[user]?.[channel];
    if (blocked && Date.parse(blocked) > Date.now()) {
      return jsonResponse({ error: "One test message per channel every 15 minutes", retryAt: blocked }, 429);
    }
    const sentAt = new Date(Date.now()).toISOString();
    const retryAt = new Date(Date.now() + TEST_COOLDOWN_MS).toISOString();
    api.testRetryTimes[user] = { ...api.testRetryTimes[user], [channel]: retryAt };
    return jsonResponse({ sentAt, retryAt });
  }
  if (path === "/api/telegram/status" && method === "GET") {
    const username = new URL(url, "http://test").searchParams.get("username") ?? "";
    return jsonResponse({ linked: api.linked.has(username) });
  }
  if (path === "/api/attribution" && method === "POST") {
    // The first answer per wallet is kept.
    api.attribution[user] ??= body?.answer;
    return jsonResponse({ success: true });
  }
  throw new Error(`Unexpected request ${method} ${url}`);
};

const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
  const method = init?.method ?? "GET";
  const body = init?.body ? JSON.parse(String(init.body)) : undefined;
  api.requests.push(`${method} ${url}${init?.body ? ` ${init.body}` : ""}`);
  return (await api.override({ method, url, body })) ?? route({ method, url, body });
});

let consoleErrors: unknown[][];

/** Advances the fake clock and lets requests and re-renders settle. */
const settle = async (ms = 0) => {
  await act(() => vi.advanceTimersByTimeAsync(ms));
  await act(() => vi.advanceTimersByTimeAsync(0));
};

const PROPS = { chainId: CHAIN_ID, market: MARKET, chainName: "Arbitrum", currentHealthFactor: "1.20" };

const renderCard = async (props: Partial<typeof PROPS> = {}, locale: Locale = "en") => {
  const view = renderWithProviders(
    <LocaleProvider locale={locale}>
      <NotificationConfig {...PROPS} {...props} />
    </LocaleProvider>,
  );
  await settle();
  return view;
};

const click = async (element: HTMLElement) => {
  fireEvent.click(element);
  await settle();
};
const type = async (element: HTMLElement, value: string) => {
  fireEvent.change(element, { target: { value } });
  await settle();
};

const button = (name: string | RegExp) => screen.getByRole<HTMLButtonElement>("button", { name });
/** Loading, not disabled: the button keeps focus and colour and ignores presses (aria-busy plus aria-disabled). */
const isBusy = (element: HTMLElement) =>
  element.getAttribute("aria-busy") === "true" && element.getAttribute("aria-disabled") === "true";
/** The solid pink fill: the Button default variant (btn-primary) or a bg-primary surface. */
const isPink = (element: Element) =>
  (element.getAttribute("class") ?? "").split(/\s+/).some(token => token === "btn-primary" || token === "bg-primary");
const serviceToggle = (name: "Email" | "Signal" | "Telegram") =>
  screen.getByRole<HTMLInputElement>("checkbox", { name });
const emailInput = () => screen.getByRole<HTMLInputElement>("textbox", { name: "Email address" });
const queryEmailInput = () => screen.queryByRole<HTMLInputElement>("textbox", { name: "Email address" });
const signalInput = () => screen.getByRole<HTMLInputElement>("textbox", { name: "Signal username" });
const telegramInput = () => screen.getByRole<HTMLInputElement>("textbox", { name: "Telegram username" });
/** The polite line under the Telegram input: whether the typed username has pressed Start in the bot. */
const telegramStatus = () =>
  within(document.querySelector<HTMLElement>("[data-field='telegram']") as HTMLElement).getByRole("status");
const statusRequests = () => api.requests.filter(request => request.startsWith("GET /api/telegram/status"));
const slider = () => screen.getByRole<HTMLInputElement>("slider");
const thresholdInput = () =>
  screen.getByRole<HTMLInputElement>("textbox", { name: "Health factor threshold (exact value)" });
/** The value next to a summary label such as "Telegram", without the row's Send test button. */
const summaryValue = (label: string) =>
  screen.queryAllByText(label, { selector: "dt" })[0]?.nextElementSibling?.firstElementChild?.textContent ?? null;
/** A summary row's Send test button, named by its channel: "Send test (Email)", "Again in 12 min (Email)". */
const testButton = (channel: string) =>
  screen.getByRole<HTMLButtonElement>("button", { name: new RegExp(`\\(${channel}\\)$`) });
const queryTestButtons = () =>
  screen.queryAllByRole("button", { name: /^(?:Send test|Again in|Sending|Poslat test|Znovu za|Odesíláme)/ });
const testRequests = () => api.requests.filter(request => request.includes("/api/notifications/test"));
/** Every message announced as an alert: the inline field errors and failure messages, in page order. */
const alerts = () => screen.queryAllByRole("alert").map(alert => alert.textContent);
/** The error summary a failed Save shows at the top of a form with more than 3 fields (it takes focus). */
const errorSummary = () => document.querySelector<HTMLElement>("form [role='alert'][tabindex='-1']");
/** The inline field errors, without the summary that repeats them. */
const fieldErrors = () =>
  screen
    .queryAllByRole("alert")
    .filter(alert => alert !== errorSummary())
    .map(alert => alert.textContent);
/**
 * The card's polite live region: what happened to the last Save, Delete or attribution answer. The Telegram status
 * line is a live region of its own, with the status role.
 */
const announcement = () => document.querySelector("[aria-live='polite']:not([role='status'])")?.textContent ?? null;
/** A summary note (an Alert) by the start of its text. */
const noteStartingWith = (prefix: string) =>
  screen.queryAllByRole("note").find(note => note.textContent?.startsWith(prefix)) ?? null;
/** The summary's "press Start in the bot" warning for a saved username that has not pressed it. */
const notLinkedWarning = () => noteStartingWith("Not linked yet");
const lastRequest = (prefix: string) => api.requests.filter(request => request.startsWith(prefix)).at(-1);
/** The JSON body of the last PUT to the config API. */
const lastPutBody = () => {
  const request = lastRequest("PUT /api/notifications/config ");
  return request === undefined ? undefined : JSON.parse(request.slice(request.indexOf("{")));
};
/** Delete asks first; the confirmation names the object on both of its buttons. */
const confirmation = () => within(screen.getByRole("group", { name: "Delete this alert?" }));
const deleteConfig = async () => {
  await click(button("Delete alert"));
  await click(confirmation().getByRole("button", { name: "Delete alert" }));
};

beforeAll(() => {
  // react-query notifies from a 0ms timeout, which fake timers push 1ms past a tick; notify on a microtask instead.
  notifyManager.setScheduler(queueMicrotask);
});
afterAll(() => notifyManager.setScheduler(callback => setTimeout(callback, 0)));

beforeEach(() => {
  mocks.address = ADDRESS;
  mocks.chainId = undefined;
  // Signed in as the connected wallet, unless a test says otherwise.
  api.session = ADDRESS.toLowerCase();
  mocks.signMessage.mockReset().mockResolvedValue(SIGNATURE);
  mocks.hasAccess = true;
  mocks.toasts = [];
  api.configs = {};
  api.linked = new Set();
  api.attribution = {};
  api.testRetryTimes = {};
  api.requests = [];
  // The attribution prompt remembers in localStorage that this browser was asked.
  window.localStorage.clear();
  api.override = () => undefined;
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"], now: NOW });
  vi.stubGlobal("fetch", fetchMock);
  // Telegram is offered only when the bot is configured, as in production once the bot is set up.
  vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", BOT);
  consoleErrors = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => void consoleErrors.push(args));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  // The component logs failed saves and deletes; anything else (such as a React act() warning) fails the test.
  expect(consoleErrors.filter(([message]) => !String(message).startsWith("Failed to"))).toEqual([]);
});

describe("NotificationConfig: loading and access", () => {
  it("renders nothing while loading, and nothing without access and without a config", async () => {
    mocks.hasAccess = false;
    const { container } = renderWithProviders(<NotificationConfig {...PROPS} />);
    expect(container.innerHTML).toBe("");
    await settle();
    expect(container.innerHTML).toBe("");
  });

  it("shows a read-only summary, with the saved Telegram username, when access lapsed", async () => {
    mocks.hasAccess = false;
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.linked.add("saved_tg");
    const { rerender } = await renderCard();
    expect(screen.getByText("Pay for access to edit")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Edit alert" })).toBeNull();
    expect(screen.getByText("Active")).toBeDefined();
    expect(summaryValue("Email")).toBe("saved@example.com");
    expect(summaryValue("Signal")).toBe("@saved.01");
    expect(summaryValue("Telegram")).toBe("@saved_tg");
    expect(notLinkedWarning()).toBeNull();
    expect(summaryValue("Threshold")).toBe("1.8");
    expect(screen.getByText("Your current health factor (1.20) is below your threshold of 1.8.")).toBeDefined();

    rerender(<NotificationConfig {...PROPS} currentHealthFactor="∞" />);
    expect(screen.queryByText(/is below your threshold/)).toBeNull();
  });

  it("hides the Active badge and warning for a disabled config and drops unknown services", async () => {
    mocks.hasAccess = false;
    api.configs[ADDRESS.toLowerCase()] = {
      [MARKET_KEY]: { ...SAVED_CONFIG, enabled: false, services: ["email", "sms"], healthFactorThreshold: 25 },
    };
    await renderCard({ currentHealthFactor: "1.00" });
    expect(screen.queryByText("Active")).toBeNull();
    expect(screen.queryByText(/is below your threshold/)).toBeNull();
    expect(summaryValue("Services")).toBe("Email");
    expect(summaryValue("Threshold")).toBe("10");
  });

  it("shows a load error with Try again instead of the Create state when the configs cannot be loaded", async () => {
    api.override = ({ method, url }) =>
      method === "GET" && url.startsWith("/api/notifications/config")
        ? jsonResponse({ error: "Database error" }, 500)
        : undefined;
    await renderCard();
    expect(screen.queryByRole("button", { name: "Create alert" })).toBeNull();
    // Only the message is announced, so the button's label changing does not repeat it.
    expect(screen.getByRole("alert").textContent).toBe("Notification settings did not load");
    expect(button("Try again")).toBeDefined();

    api.override = () => undefined;
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    await click(button("Try again"));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(summaryValue("Email")).toBe("saved@example.com");
  });

  it("keeps the load error on screen while a retry is in flight", async () => {
    let answer: () => Response | Promise<Response> = () => jsonResponse({ error: "Database error" }, 500);
    api.override = ({ method, url }) =>
      method === "GET" && url.startsWith("/api/notifications/config") ? answer() : undefined;
    await renderCard();
    answer = () => new Promise<Response>(() => undefined);
    await click(button("Try again"));
    expect(screen.getByRole("alert")).toBeDefined();
    expect(isBusy(button("Retrying"))).toBe(true);
  });
});

describe("NotificationConfig: signing in", () => {
  const SIGN_IN_TITLE = "Sign in to manage your alerts";
  const authRequests = () => api.requests.filter(request => request.includes("/api/auth/"));
  const alertRequests = () =>
    api.requests.filter(request => SIGNED_OUT_PATHS.some(path => request.includes(` ${path}`)));
  const signedMessage = () => mocks.signMessage.mock.calls[0]?.[0].message;

  beforeEach(() => {
    api.session = null;
  });

  it("asks a wallet with access to sign in before it loads any alert, then loads them", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    await renderCard();
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(SIGN_IN_TITLE);
    expect(
      screen.getByText(
        "Your wallet signs a message that proves the address is yours. It is not a transaction and costs no gas.",
      ),
    ).toBeDefined();
    expect(alertRequests()).toEqual([]);
    expect(mocks.signMessage).not.toHaveBeenCalled();

    await click(button("Sign in with wallet"));

    expect(mocks.signMessage.mock.calls).toEqual([[{ account: ADDRESS, message: expect.any(String) }]]);
    expect(authRequests()).toEqual([
      "GET /api/auth/session",
      "POST /api/auth/nonce",
      `POST /api/auth/verify ${JSON.stringify({ message: signedMessage(), signature: SIGNATURE })}`,
    ]);
    expect(alertRequests()).toEqual(["GET /api/notifications/config", "GET /api/notifications/test"]);
    expect(screen.queryByText(SIGN_IN_TITLE)).toBeNull();
    expect(summaryValue("Email")).toBe("saved@example.com");
  });

  it("signs an EIP-4361 message for this site, the connected wallet and its chain, with the server's nonce", async () => {
    mocks.chainId = 8453;
    await renderCard();
    await click(button("Sign in with wallet"));
    expect(signedMessage()).toBe(
      `${window.location.host} wants you to sign in with your Ethereum account:\n` +
        `${getAddress(ADDRESS)}\n\n` +
        "Sign in to Tokenping to see and edit your health factor alerts.\n\n" +
        `URI: ${window.location.origin}\n` +
        "Version: 1\n" +
        "Chain ID: 8453\n" +
        `Nonce: ${NONCE}\n` +
        "Issued At: 2026-10-14T12:00:00.000Z\n" +
        "Expiration Time: 2026-10-14T12:05:00.000Z",
    );
  });

  it("names the site's network when the wallet is on a chain the server cannot check signatures on", async () => {
    mocks.chainId = 31337;
    await renderCard();
    await click(button("Sign in with wallet"));
    expect(signedMessage()).toContain("\nChain ID: 42161\n");
  });

  it("keeps the button and says so when the wallet declines, and signs in on the next try", async () => {
    mocks.signMessage.mockRejectedValueOnce(new UserRejectedRequestError(new Error("User rejected the request.")));
    await renderCard();
    await click(button("Sign in with wallet"));

    expect(screen.getByText("You declined the signature request. Sign in to see and edit your alerts.")).toBeDefined();
    expect(authRequests()).toEqual(["GET /api/auth/session", "POST /api/auth/nonce"]);
    expect(alertRequests()).toEqual([]);
    expect(consoleErrors).toEqual([]);

    await click(button("Sign in with wallet"));
    expect(screen.queryByText(/You declined/)).toBeNull();
    expect(button("Create alert")).toBeDefined();
  });

  it("says signing in failed when the server refuses, and logs why", async () => {
    api.override = ({ url }) =>
      url === "/api/auth/verify" ? jsonResponse({ error: "The signature does not match this wallet" }, 401) : undefined;
    await renderCard();
    await click(button("Sign in with wallet"));
    expect(screen.getByText("Couldn't sign you in. Try again.")).toBeDefined();
    expect(alertRequests()).toEqual([]);
    expect(String(consoleErrors[0]?.[0])).toBe("Failed to sign in:");
  });

  it("shows the button as busy, waiting for the wallet, while the signature is pending", async () => {
    const signature = deferred<string>();
    mocks.signMessage.mockReturnValue(signature.promise);
    await renderCard();
    await click(button("Sign in with wallet"));
    expect(isBusy(button("Waiting for your wallet"))).toBe(true);
    signature.resolve(SIGNATURE);
    await settle();
    expect(button("Create alert")).toBeDefined();
  });

  it("offers a wallet whose access lapsed a secondary Sign in if it signed in here before, then its alert read-only", async () => {
    window.localStorage.setItem("tokenping:signed-in-wallets", JSON.stringify([ADDRESS.toLowerCase()]));
    mocks.hasAccess = false;
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    const { container } = await renderCard();
    // The paywall above has the view's pink button.
    expect(isPink(button("Sign in with wallet"))).toBe(false);
    expect([container, ...container.querySelectorAll("[class]")].filter(isPink)).toHaveLength(0);

    await click(button("Sign in with wallet"));
    expect(screen.getByText("Pay for access to edit")).toBeDefined();
    expect(summaryValue("Email")).toBe("saved@example.com");
  });

  it("remembers on this browser which wallets signed in", async () => {
    await renderCard();
    await click(button("Sign in with wallet"));
    expect(JSON.parse(window.localStorage.getItem("tokenping:signed-in-wallets") ?? "null")).toEqual([
      ADDRESS.toLowerCase(),
    ]);
  });

  it("renders nothing for a wallet without access and without a session, and loads nothing", async () => {
    mocks.hasAccess = false;
    const { container } = await renderCard();
    expect(container.innerHTML).toBe("");
    expect(alertRequests()).toEqual([]);
  });

  it("renders nothing while the session is being read", async () => {
    api.override = ({ url }) => (url === "/api/auth/session" ? new Promise<Response>(() => undefined) : undefined);
    const { container } = await renderCard();
    expect(container.innerHTML).toBe("");
  });

  it("asks again when the session ends during an edit, and keeps the draft for after signing in", async () => {
    api.session = ADDRESS.toLowerCase();
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: { ...SAVED_CONFIG, services: ["email"] } };
    await renderCard();
    await click(button("Edit alert"));
    await type(emailInput(), "new@example.com");

    api.session = null;
    await click(button("Save alert"));
    expect(mocks.toasts).toEqual(["error: Your sign-in has ended. Sign in with your wallet again."]);
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(SIGN_IN_TITLE);

    await click(button("Sign in with wallet"));
    expect(emailInput().value).toBe("new@example.com");
    await click(button("Save alert"));
    expect(mocks.toasts.at(-1)).toBe("success: Alert saved");
    expect(api.configs[ADDRESS.toLowerCase()][MARKET_KEY]).toMatchObject({ email: "new@example.com" });
  });

  it("asks the new wallet to sign in after a wallet switch, as the session is the old wallet's", async () => {
    api.session = ADDRESS.toLowerCase();
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    const { rerender } = await renderCard();
    expect(summaryValue("Email")).toBe("saved@example.com");

    mocks.address = OTHER_ADDRESS;
    rerender(<NotificationConfig {...PROPS} />);
    await settle();
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(SIGN_IN_TITLE);
    expect(summaryValue("Email")).toBeNull();

    await click(button("Sign in with wallet"));
    expect(mocks.signMessage.mock.calls[0][0].account).toBe(OTHER_ADDRESS);
    expect(api.session).toBe(OTHER_ADDRESS.toLowerCase());
    expect(button("Create alert")).toBeDefined();
  });

  it("makes Sign in the view's one pink action, in tokens only", async () => {
    const { container } = await renderCard();
    expect(isPink(button("Sign in with wallet"))).toBe(true);
    expect([container, ...container.querySelectorAll("[class]")].filter(isPink)).toHaveLength(1);
  });

  it("asks in Czech, with no dashes", async () => {
    mocks.signMessage.mockRejectedValueOnce(new UserRejectedRequestError(new Error("User rejected the request.")));
    const { container } = await renderCard({}, "cs");
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("Přihlaste se ke správě upozornění");
    await click(button("Přihlásit se peněženkou"));
    expect(
      screen.getByText("Žádost o podpis jste odmítli. Pro zobrazení a úpravy upozornění se přihlaste."),
    ).toBeDefined();
    expect(container.textContent).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
    mocks.signMessage.mockReturnValue(new Promise(() => undefined));
    await click(button("Přihlásit se peněženkou"));
    expect(isBusy(button("Čekáme na vaši peněženku"))).toBe(true);
    expect(signedMessage()).toContain(
      "\n\nPřihlášení do Tokenpingu pro zobrazení a úpravy upozornění na health factor.\n\n",
    );
  });
});

describe("NotificationConfig: creating and editing", () => {
  it("validates on Save, shows each error under its field, then saves the normalized form", async () => {
    await renderCard();
    await click(button("Create alert"));
    // Save is never disabled: it reports what is missing and moves focus there.
    expect(button("Save alert").disabled).toBe(false);
    await click(button("Save alert"));
    expect(alerts()).toEqual(["Select at least one notification service."]);
    expect(document.activeElement).toBe(serviceToggle("Email"));

    // An error clears as soon as it is fixed; a field that appears afterwards stays quiet until the next Save.
    await click(serviceToggle("Email"));
    expect(alerts()).toEqual([]);
    await type(emailInput(), "  not-an-email ");
    await click(button("Save alert"));
    // Three fields (services, email, threshold): no summary, focus goes to the field.
    expect(errorSummary()).toBeNull();
    expect(alerts()).toEqual(["Enter an email address like name@example.com."]);
    expect(document.activeElement).toBe(emailInput());
    expect(emailInput().getAttribute("aria-invalid")).toBe("true");
    await type(emailInput(), " me@example.com ");
    expect(alerts()).toEqual([]);
    expect(emailInput().getAttribute("aria-invalid")).toBeNull();

    // Four fields: the failed Save shows the summary at the top and focuses it.
    await click(serviceToggle("Signal"));
    await type(signalInput(), "@");
    await click(button("Save alert"));
    expect(fieldErrors()).toEqual(["Enter your Signal username."]);
    expect(errorSummary()?.textContent).toBe("Fix 1 field to saveEnter your Signal username.");
    expect(document.activeElement).toBe(errorSummary());
    // The message follows what is typed until the field is valid, in the summary too.
    await type(signalInput(), " @alice ");
    expect(fieldErrors()).toEqual([
      "Enter a Signal username like alice.42. Find yours in Signal under Settings, then Profile.",
    ]);
    expect(within(errorSummary() as HTMLElement).getByRole("link").textContent).toBe(
      "Enter a Signal username like alice.42. Find yours in Signal under Settings, then Profile.",
    );
    await type(signalInput(), " u:alice.42 ");
    expect(alerts()).toEqual([]);
    expect(errorSummary()).toBeNull();
    await type(thresholdInput(), "2,5");
    fireEvent.blur(thresholdInput());
    expect(lastRequest("PUT")).toBeUndefined();
    await click(button("Save alert"));
    expect(mocks.toasts).toEqual(["success: Alert saved"]);
    const { locale, ...body } = lastPutBody();
    expect(body).toEqual({
      chainId: CHAIN_ID,
      market: MARKET,
      enabled: true,
      services: ["email", "signal"],
      healthFactorThreshold: 2.5,
      email: "me@example.com",
      signalRecipient: "alice.42",
      telegramUsername: null,
      // Both new channels start in the page's language.
      channelLocales: { email: "en", signal: "en" },
    });
    // The page's language, once the client forwards it (the "saves the page's language" tests pin the hand-over).
    expect([undefined, "en"]).toContain(locale);
    expect(summaryValue("Email")).toBe("me@example.com");
    expect(summaryValue("Signal")).toBe("@alice.42");
    expect(summaryValue("Threshold")).toBe("2.5");
  });

  it("lists every invalid field in a focused summary that links to each field, and submits with Enter", async () => {
    await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    await click(serviceToggle("Signal"));
    await click(serviceToggle("Email"));
    await type(emailInput(), "nope");
    await act(async () => {
      fireEvent.submit(emailInput().form as HTMLFormElement);
    });
    await settle();
    expect(fieldErrors()).toEqual([
      "Enter an email address like name@example.com.",
      "Enter your Signal username.",
      "Enter your Telegram username.",
    ]);

    const summary = errorSummary() as HTMLElement;
    expect(summary.getAttribute("role")).toBe("alert");
    expect(document.activeElement).toBe(summary);
    expect(within(summary).getByText("Fix 3 fields to save")).toBeDefined();
    // In display order, each a link to its field.
    const links = within(summary).getAllByRole("link");
    expect(links.map(link => link.textContent)).toEqual(fieldErrors());
    const targets = links.map(link => document.getElementById((link.getAttribute("href") ?? "").slice(1)));
    expect(targets.map(target => target?.getAttribute("data-field"))).toEqual(["email", "signalRecipient", "telegram"]);
    // Following a link focuses the field's control, not just the group around it.
    await click(links[1]);
    expect(document.activeElement).toBe(signalInput());
    await click(links[2]);
    expect(document.activeElement).toBe(telegramInput());

    const descriptionsOf = (input: HTMLElement) =>
      (input.getAttribute("aria-describedby") ?? "").split(" ").map(id => document.getElementById(id)?.textContent);
    expect(descriptionsOf(emailInput())).toEqual([
      "Alerts are sent to this address.",
      "Enter an email address like name@example.com.",
    ]);
    expect(descriptionsOf(signalInput())).toEqual([
      "In Signal, open Settings, then Profile. It looks like alice.42.",
      "Enter your Signal username.",
    ]);
    expect(descriptionsOf(telegramInput())).toEqual([
      "Alerts go to this Telegram account. Find it in Telegram under Settings, then Username.",
      "Enter your Telegram username.",
    ]);
    expect(api.requests.some(request => request.startsWith("PUT"))).toBe(false);

    // Another failed Save focuses the summary again; fixing a field takes it off the list.
    await type(emailInput(), "me@example.com");
    expect(within(summary).getByText("Fix 2 fields to save")).toBeDefined();
    await click(button("Save alert"));
    expect(document.activeElement).toBe(errorSummary());
    expect(within(errorSummary() as HTMLElement).getAllByRole("link")).toHaveLength(2);
  });

  it("falls back to the Email service for an enabled config without valid services, also after Cancel", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: { ...SAVED_CONFIG, services: [], healthFactorThreshold: 0 } };
    await renderCard();
    expect(summaryValue("Services")).toBe("Email");
    expect(summaryValue("Threshold")).toBe("1.5");
    await click(button("Edit alert"));
    expect(emailInput().value).toBe("saved@example.com");
    await click(button("Cancel"));
    expect(summaryValue("Services")).toBe("Email");
  });

  it("edits the threshold through the text input and the slider", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    await renderCard({ currentHealthFactor: "1.75" });
    await click(button("Edit alert"));
    const state = () => [thresholdInput().value, slider().value];

    await type(thresholdInput(), "abc");
    expect(state()).toEqual(["1.80", "1.8"]);
    await type(thresholdInput(), "12.345");
    expect(state()).toEqual(["1.80", "1.8"]);
    // An incomplete number does not move the threshold, and blurring it restores the last complete one.
    await type(thresholdInput(), "3.");
    expect(state()).toEqual(["3.", "1.8"]);
    fireEvent.blur(thresholdInput());
    expect(state()).toEqual(["1.80", "1.8"]);
    await type(thresholdInput(), "");
    expect(state()).toEqual(["", "1.8"]);
    fireEvent.blur(thresholdInput());
    expect(state()).toEqual(["1.80", "1.8"]);
    await type(thresholdInput(), "0.5");
    expect(state()).toEqual(["0.5", "1.1"]);
    await type(thresholdInput(), "99");
    fireEvent.blur(thresholdInput());
    expect(state()).toEqual(["10.00", "3"]);
    // The slider stops at 3 but announces the threshold that applies.
    expect(slider().getAttribute("aria-valuetext")).toBe("10");
    expect(screen.getByText(/be notified when your health factor drops below/).textContent).toBe(
      "You'll be notified when your health factor drops below 10 on Arbitrum.",
    );

    const prevented = ["e", "E", "+", "-", "1"].map(key => !fireEvent.keyDown(thresholdInput(), { key }));
    expect(prevented).toEqual([true, true, true, true, false]);

    // The slider rewrites the text unless the user is typing in it.
    await type(slider(), "2.7");
    expect(state()).toEqual(["2.70", "2.7"]);
    act(() => thresholdInput().focus());
    await type(slider(), "2.4");
    expect(state()).toEqual(["2.70", "2.4"]);
    act(() => thresholdInput().blur());
    await type(slider(), "5");
    expect(state()).toEqual(["3.00", "3"]);
  });

  it("cancels edits back to the saved config, deletes, and cancels back to the empty state", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    await renderCard();
    await click(button("Edit alert"));
    await click(serviceToggle("Signal"));
    await type(emailInput(), "changed@example.com");
    await click(button("Cancel"));
    expect(summaryValue("Email")).toBe("saved@example.com");
    expect(summaryValue("Signal")).toBe("@saved.01");

    await click(button("Edit alert"));
    await deleteConfig();
    expect(lastRequest("DELETE")).toBe(`DELETE /api/notifications/config {"chainId":${CHAIN_ID},"market":"${MARKET}"}`);
    expect(screen.queryByRole("button", { name: "Delete alert" })).toBeNull();
    expect(queryEmailInput()).toBeNull();
    expect(mocks.toasts).toEqual([]);
    // Announced, and focus continues at the start of the empty form instead of falling to the page.
    expect(announcement()).toBe("Alert deleted");
    expect(document.activeElement).toBe(serviceToggle("Email"));
    await click(button("Cancel"));
    expect(button("Create alert")).toBeDefined();
  });

  it("asks before deleting, with focus on Keep alert, and Keep alert sends nothing", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    await renderCard();
    await click(button("Edit alert"));
    await click(button("Delete alert"));
    const group = screen.getByRole("group", { name: "Delete this alert?" });
    const description = document.getElementById(group.getAttribute("aria-describedby") ?? "");
    expect(description?.textContent).toBe("Tokenping stops sending health factor alerts for Arbitrum.");
    // Enter on the focused button keeps the alert; Save is not on screen next to the confirmation.
    expect(document.activeElement).toBe(confirmation().getByRole("button", { name: "Keep alert" }));
    expect(screen.queryByRole("button", { name: "Save alert" })).toBeNull();
    expect(confirmation().getByRole("button", { name: "Delete alert" }).className).toContain("btn-error");

    await click(confirmation().getByRole("button", { name: "Keep alert" }));
    expect(screen.queryByRole("group", { name: "Delete this alert?" })).toBeNull();
    expect(document.activeElement).toBe(button("Delete alert"));
    expect(api.requests.some(request => request.startsWith("DELETE"))).toBe(false);
    expect(button("Save alert")).toBeDefined();
  });

  it("returns focus to the button that opened the form after Save and Cancel", async () => {
    // Asked before, so no attribution prompt takes focus after the save.
    markAttributionPrompted();
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: { ...SAVED_CONFIG, services: ["email"] } };
    const { unmount } = await renderCard();
    await click(button("Edit alert"));
    await click(button("Save alert"));
    expect(document.activeElement).toBe(button("Edit alert"));
    await click(button("Edit alert"));
    await click(button("Cancel"));
    expect(document.activeElement).toBe(button("Edit alert"));
    unmount();

    api.configs = {};
    await renderCard();
    await click(button("Create alert"));
    await click(button("Cancel"));
    expect(document.activeElement).toBe(button("Create alert"));
  });

  it("announces a save, a delete and an answer in the card's live region, which outlives the form", async () => {
    await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Email"));
    await type(emailInput(), "me@example.com");
    expect(announcement()).toBe("");
    await click(button("Save alert"));
    expect(queryEmailInput()).toBeNull();
    expect(announcement()).toBe("Alert saved");
    await type(screen.getByRole("textbox", { name: "How did you hear about Tokenping? (optional)" }), "Reddit");
    await click(button("Send answer"));
    expect(announcement()).toBe("Answer sent");

    // Editing starts quiet, so the same message announced again is a change the screen reader hears.
    await click(button("Edit alert"));
    expect(announcement()).toBe("");
    await click(button("Save alert"));
    expect(announcement()).toBe("Alert saved");
    await click(button("Edit alert"));
    await deleteConfig();
    expect(announcement()).toBe("Alert deleted");
  });

  it("requires a connected wallet for saving", async () => {
    mocks.address = undefined;
    await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Email"));
    await type(emailInput(), "me@example.com");
    await click(button("Save alert"));
    expect(mocks.toasts).toEqual(["error: Wallet not connected"]);
    expect(api.requests).toEqual([]);
  });
});

describe("NotificationConfig: failures", () => {
  it("reports save and delete failures with the server's message", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: { ...SAVED_CONFIG, services: ["email", "signal"] } };
    let put = () => jsonResponse({ error: "Active paid access required to update notification config" }, 403);
    let del = () => jsonResponse({ error: "Active paid access required to delete notification config" }, 403);
    api.override = ({ method, url }) => {
      if (method === "PUT") return put();
      if (method === "DELETE" && url === "/api/notifications/config") return del();
      return undefined;
    };
    await renderCard();
    await click(button("Edit alert"));

    await click(button("Save alert"));
    put = () => new Response("<html>oops</html>", { status: 500 });
    await click(button("Save alert"));
    await deleteConfig();
    del = () => new Response("not json", { status: 500 });
    // The confirmation stays open after a failure, so Delete can be tried again.
    await click(confirmation().getByRole("button", { name: "Delete alert" }));
    expect(mocks.toasts).toEqual([
      "error: Active paid access required to update notification config",
      "error: Failed to save notification config",
      "error: Active paid access required to delete notification config",
      "error: Failed to delete notification config",
    ]);
    expect(confirmation().getByRole("button", { name: "Delete alert" })).toBeDefined();
    expect(emailInput().value).toBe("saved@example.com");
    // The toasts are not announced; the card's live region carries the last failure.
    expect(announcement()).toBe("Failed to delete notification config");
  });

  it("keeps Save and Delete busy and ignores presses while their request is in flight", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: { ...SAVED_CONFIG, services: ["email"] } };
    const put = deferred<Response>();
    const del = deferred<void>();
    api.override = call => {
      if (call.method === "PUT") return put.promise;
      if (call.method === "DELETE" && call.url === "/api/notifications/config")
        return del.promise.then(() => route(call));
      return undefined;
    };
    await renderCard();
    await click(button("Edit alert"));

    await click(button("Save alert"));
    expect(isBusy(button("Saving"))).toBe(true);
    // A second press (or Enter) while saving sends nothing.
    await click(button("Saving"));
    await act(async () => {
      fireEvent.submit(emailInput().form as HTMLFormElement);
    });
    expect(api.requests.filter(request => request.startsWith("PUT"))).toHaveLength(1);
    put.resolve(jsonResponse({ error: "Database error" }, 502));
    await settle();
    expect(button("Save alert").getAttribute("aria-busy")).toBeNull();

    await deleteConfig();
    expect(isBusy(button("Deleting"))).toBe(true);
    await click(button("Deleting"));
    expect(api.requests.filter(request => request.startsWith("DELETE"))).toHaveLength(1);
    del.resolve();
    await settle();
    expect(screen.queryByRole("button", { name: /^Delet/ })).toBeNull();
    expect(mocks.toasts).toEqual(["error: Database error"]);
  });
});

describe("NotificationConfig: Telegram username", () => {
  it("asks for a Telegram username on Save, focuses its input and says what a valid one looks like", async () => {
    await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    expect(telegramInput().value).toBe("");
    expect(telegramStatus().textContent).toBe("");

    await click(button("Save alert"));
    // Three fields (services, Telegram, threshold): no summary, focus goes to the input.
    expect(errorSummary()).toBeNull();
    expect(alerts()).toEqual(["Enter your Telegram username."]);
    expect(document.activeElement).toBe(telegramInput());
    expect(telegramInput().getAttribute("aria-invalid")).toBe("true");

    // The message follows what is typed; an invalid name is not checked with the bot.
    await type(telegramInput(), "alice-eth");
    expect(alerts()).toEqual([
      "Enter a Telegram username like alice_eth: 4 to 32 letters, digits or underscores, starting with a letter and not ending with _.",
    ]);
    await settle(400);
    expect(telegramStatus().textContent).toBe("");
    expect(statusRequests()).toEqual([]);
    await click(button("Save alert"));
    expect(document.activeElement).toBe(telegramInput());
    expect(lastRequest("PUT")).toBeUndefined();

    await type(telegramInput(), "@Alice_Eth");
    expect(alerts()).toEqual([]);
    expect(telegramInput().getAttribute("aria-invalid")).toBeNull();
  });

  it("saves a username that has not pressed Start yet, normalized, and says where to press Start", async () => {
    await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    await type(telegramInput(), " @Alice_Eth ");
    // Checked once typing pauses, under the name as it is stored.
    expect(telegramStatus().textContent).toBe("Checking");
    await settle(400);
    expect(statusRequests()).toEqual(["GET /api/telegram/status?username=alice_eth"]);
    expect(telegramStatus().textContent).toBe(
      `Not linked yet: press Start in @${BOT} once.Open @${BOT} (opens in a new tab)`,
    );
    expect(within(telegramStatus()).getByRole("link").getAttribute("href")).toBe(`https://t.me/${BOT}`);

    // Not having pressed Start does not block Save.
    await click(button("Save alert"));
    expect(mocks.toasts).toEqual(["success: Alert saved"]);
    expect(lastPutBody()).toMatchObject({
      services: ["telegram"],
      email: null,
      signalRecipient: null,
      telegramUsername: "alice_eth",
    });
    expect(api.configs[ADDRESS.toLowerCase()][MARKET_KEY]).toMatchObject({ telegramUsername: "alice_eth" });
    expect(summaryValue("Telegram")).toBe("@alice_eth");
    // The summary keeps saying so, with the bot link, until that account presses Start.
    expect(notLinkedWarning()?.textContent).toBe(
      `Not linked yet: press Start in @${BOT} once.Open @${BOT} (opens in a new tab)`,
    );
    const link = within(notLinkedWarning() as HTMLElement).getByRole("link");
    expect([link.getAttribute("href"), link.getAttribute("target"), link.getAttribute("rel")]).toEqual([
      `https://t.me/${BOT}`,
      "_blank",
      "noopener noreferrer",
    ]);

    // The summary does not poll; it asks again when the tab gets focus back from Telegram.
    api.linked.add("alice_eth");
    await settle(60_000);
    expect(notLinkedWarning()).not.toBeNull();
    await act(async () => {
      window.dispatchEvent(new Event("visibilitychange"));
    });
    await settle();
    expect(notLinkedWarning()).toBeNull();
    expect(summaryValue("Telegram")).toBe("@alice_eth");
  });

  it("turns to linked while the form is open once the account presses Start, then stops asking", async () => {
    await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    await type(telegramInput(), "alice_eth");
    await settle(400);
    expect(telegramStatus().textContent).toMatch(/^Not linked yet/);

    api.linked.add("alice_eth");
    await settle(3000);
    // A polite live region, so the change is announced while the person comes back from Telegram.
    expect(telegramStatus().getAttribute("aria-live")).toBe("polite");
    expect(telegramStatus().textContent).toBe("@alice_eth is linked: alerts will arrive in your Telegram chat.");
    const asked = statusRequests().length;
    await settle(60_000);
    expect(statusRequests()).toHaveLength(asked);
  });

  it("says when the status cannot be checked, still saves, and warns about nothing in the summary", async () => {
    api.override = ({ url }) =>
      url.startsWith("/api/telegram/status") ? jsonResponse({ error: "Database error" }, 500) : undefined;
    await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    await type(telegramInput(), "alice_eth");
    await settle(400);
    // Asked once more before giving up.
    expect(telegramStatus().textContent).toBe("Checking");
    await settle(1000);
    expect(statusRequests()).toHaveLength(2);
    expect(telegramStatus().textContent).toBe("Couldn't check whether this username is linked. You can still save.");

    await click(button("Save alert"));
    expect(mocks.toasts).toEqual(["success: Alert saved"]);
    expect(lastPutBody()).toMatchObject({ telegramUsername: "alice_eth" });
    expect(summaryValue("Telegram")).toBe("@alice_eth");
    // Unknown is not "not linked".
    await settle(5000);
    expect(notLinkedWarning()).toBeNull();
  });

  it("edits a saved username, keeps it after Cancel, and drops it when Telegram is deselected", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.linked.add("saved_tg");
    await renderCard();
    expect(summaryValue("Telegram")).toBe("@saved_tg");
    expect(notLinkedWarning()).toBeNull();

    await click(button("Edit alert"));
    expect(telegramInput().value).toBe("saved_tg");
    expect(telegramStatus().textContent).toBe("@saved_tg is linked: alerts will arrive in your Telegram chat.");
    await type(telegramInput(), "other_name");
    await click(button("Cancel"));
    expect(summaryValue("Telegram")).toBe("@saved_tg");
    await click(button("Edit alert"));
    expect(telegramInput().value).toBe("saved_tg");

    await click(serviceToggle("Telegram"));
    expect(screen.queryByRole("textbox", { name: "Telegram username" })).toBeNull();
    await click(button("Save alert"));
    expect(lastPutBody()).toMatchObject({ services: ["email", "signal"], telegramUsername: null });
    expect(api.configs[ADDRESS.toLowerCase()][MARKET_KEY]).not.toHaveProperty("telegramUsername");
    expect(summaryValue("Telegram")).toBeNull();
  });

  it("shows the card without waiting for the Telegram status", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.override = ({ url }) =>
      url.startsWith("/api/telegram/status") ? new Promise<Response>(() => undefined) : undefined;
    await renderCard();
    expect(summaryValue("Email")).toBe("saved@example.com");
    expect(summaryValue("Telegram")).toBe("@saved_tg");
    // Still asking, so nothing is claimed yet.
    expect(notLinkedWarning()).toBeNull();
  });

  it("shows the Telegram row only while Telegram is selected, and the warning only with a bot to link to", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: { ...SAVED_CONFIG, services: ["email"] } };
    const emailOnly = await renderCard();
    expect(summaryValue("Telegram")).toBeNull();
    expect(statusRequests()).toEqual([]);
    emailOnly.unmount();

    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: { ...SAVED_CONFIG, services: ["telegram"] } };
    await renderCard();
    expect(summaryValue("Telegram")).toBe("@saved_tg");
    expect(statusRequests()).toEqual(["GET /api/telegram/status?username=saved_tg"]);
    expect(notLinkedWarning()).toBeNull();
  });

  it("stops asking on Cancel and on unmount", async () => {
    const { unmount } = await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    await type(telegramInput(), "alice_eth");
    // A response body is read on the real event loop, so an answer lands at the end of the step it was asked in.
    await settle(400);
    await settle(3000);
    expect(statusRequests()).toHaveLength(2);
    await click(button("Cancel"));
    const afterCancel = statusRequests().length;
    await settle(60_000);
    expect(statusRequests()).toHaveLength(afterCancel);

    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    await type(telegramInput(), "alice_eth");
    await settle(400);
    const beforeUnmount = statusRequests().length;
    expect(beforeUnmount).toBeGreaterThan(afterCancel);
    unmount();
    await settle(60_000);
    expect(statusRequests()).toHaveLength(beforeUnmount);
  });
});

describe("NotificationConfig: Send test", () => {
  const LIMIT_NOTE = "A test sends this alert and your position as they are now. One per channel every 15 minutes.";
  const inMinutes = (minutes: number) => new Date(NOW + minutes * 60_000).toISOString();
  const testNames = () =>
    queryTestButtons().map(element => [element.textContent, (element as HTMLButtonElement).disabled]);
  const lastTestBody = () => {
    const request = lastRequest("POST /api/notifications/test ");
    return request === undefined ? undefined : JSON.parse(request.slice(request.indexOf("{")));
  };

  it("puts a Send test button on every saved channel, with the limit note, and reads the cooldowns once", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.linked.add("saved_tg");
    await renderCard();
    expect(queryTestButtons().map(element => element.getAttribute("type"))).toEqual(["button", "button", "button"]);
    expect(testNames()).toEqual([
      ["Send test (Email)", false],
      ["Send test (Signal)", false],
      ["Send test (Telegram)", false],
    ]);
    // Each in its channel's row, so the three buttons are told apart by name.
    expect(testButton("Email").closest("dd")?.previousElementSibling?.textContent).toBe("Email");
    expect(testButton("Telegram").closest("dd")?.firstElementChild?.textContent).toBe("@saved_tg");
    expect(screen.getByText(LIMIT_NOTE)).toBeDefined();
    expect(testRequests()).toEqual(["GET /api/notifications/test"]);
    // Outline buttons: the summary still has no pink of its own.
    expect(queryTestButtons().every(element => !element.className.includes("btn-primary"))).toBe(true);
  });

  it("shows a button only for the channels the alert sends by", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: { ...SAVED_CONFIG, services: ["signal"] } };
    await renderCard();
    expect(testNames()).toEqual([["Send test (Signal)", false]]);
    expect(screen.getByText(LIMIT_NOTE)).toBeDefined();
  });

  it("shows no buttons and no note without access, since the server would refuse the send", async () => {
    mocks.hasAccess = false;
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.linked.add("saved_tg");
    await renderCard();
    expect(summaryValue("Email")).toBe("saved@example.com");
    expect(queryTestButtons()).toEqual([]);
    expect(screen.queryByText(LIMIT_NOTE)).toBeNull();
    expect(testRequests().some(request => request.startsWith("POST"))).toBe(false);
  });

  it("shows no buttons while the form is open, and none before an alert is saved", async () => {
    await renderCard();
    expect(queryTestButtons()).toEqual([]);
    await click(button("Create alert"));
    await click(serviceToggle("Email"));
    await type(emailInput(), "me@example.com");
    expect(queryTestButtons()).toEqual([]);
    await click(button("Save alert"));
    await click(button("Skip"));
    expect(testNames()).toEqual([["Send test (Email)", false]]);
  });

  it("keeps Telegram's button off while the saved username has not pressed Start, and turns it on once it has", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    await renderCard();
    expect(notLinkedWarning()).not.toBeNull();
    expect(testNames()).toEqual([
      ["Send test (Email)", false],
      ["Send test (Signal)", false],
      ["Send test (Telegram)", true],
    ]);

    api.linked.add("saved_tg");
    await act(async () => {
      window.dispatchEvent(new Event("visibilitychange"));
    });
    await settle();
    expect(notLinkedWarning()).toBeNull();
    expect(testButton("Telegram").disabled).toBe(false);
  });

  it("leaves Telegram's button on while the link status is still unknown or being checked", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: { ...SAVED_CONFIG, services: ["telegram"] } };
    api.override = ({ url }) =>
      url.startsWith("/api/telegram/status") ? new Promise<Response>(() => undefined) : undefined;
    const checking = await renderCard();
    expect(testButton("Telegram").disabled).toBe(false);
    checking.unmount();

    api.override = ({ url }) =>
      url.startsWith("/api/telegram/status") ? jsonResponse({ error: "Database error" }, 500) : undefined;
    await renderCard();
    await settle(1000);
    expect(testButton("Telegram").disabled).toBe(false);
  });

  it("sends a test for the saved market and channel, says so, and counts down until the button is back", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.linked.add("saved_tg");
    await renderCard();
    await click(testButton("Email"));

    // Only the market and the channel: the recipient is the saved one, read by the server.
    expect(lastTestBody()).toEqual({ chainId: CHAIN_ID, market: MARKET, channel: "email" });
    expect(mocks.toasts).toEqual(["success: Test message sent by Email. Check that it arrived."]);
    expect(announcement()).toBe("Test message sent by Email. Check that it arrived.");
    expect(testNames()).toEqual([
      ["Again in 15 min (Email)", true],
      ["Send test (Signal)", false],
      ["Send test (Telegram)", false],
    ]);

    await settle(60_000);
    expect(testButton("Email").textContent).toBe("Again in 14 min (Email)");
    await settle(13 * 60_000);
    expect(testButton("Email").textContent).toBe("Again in 1 min (Email)");
    expect(testButton("Email").disabled).toBe(true);
    // The clock ticks while the channel cools down, so the button turns back on by itself.
    await settle(60_000);
    expect(testButton("Email").textContent).toBe("Send test (Email)");
    expect(testButton("Email").disabled).toBe(false);
    // No new read was needed for that.
    expect(testRequests().filter(request => request.startsWith("GET"))).toHaveLength(1);

    await click(testButton("Email"));
    expect(testRequests().filter(request => request.startsWith("POST"))).toHaveLength(2);
    expect(testButton("Email").textContent).toBe("Again in 15 min (Email)");
  });

  it("announces the same success again for a second channel", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.linked.add("saved_tg");
    await renderCard();
    await click(testButton("Signal"));
    await click(testButton("Telegram"));
    expect(
      testRequests()
        .filter(request => request.startsWith("POST"))
        .map(request => JSON.parse(request.slice(request.indexOf("{"))).channel),
    ).toEqual(["signal", "telegram"]);
    expect(mocks.toasts).toEqual([
      "success: Test message sent by Signal. Check that it arrived.",
      "success: Test message sent by Telegram. Check that it arrived.",
    ]);
    expect(announcement()).toBe("Test message sent by Telegram. Check that it arrived.");
    expect(testNames()).toEqual([
      ["Send test (Email)", false],
      ["Again in 15 min (Signal)", true],
      ["Again in 15 min (Telegram)", true],
    ]);
  });

  it("shows the cooldown the server reports, so a reload or another tab never offers a refused click", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.linked.add("saved_tg");
    api.testRetryTimes[ADDRESS.toLowerCase()] = { signal: inMinutes(12), telegram: inMinutes(-1) };
    await renderCard();
    expect(testNames()).toEqual([
      ["Send test (Email)", false],
      ["Again in 12 min (Signal)", true],
      ["Send test (Telegram)", false],
    ]);
    // A part of a minute counts as a whole one.
    await settle(30_000);
    expect(testButton("Signal").textContent).toBe("Again in 12 min (Signal)");
    await settle(30_000);
    expect(testButton("Signal").textContent).toBe("Again in 11 min (Signal)");
  });

  /** Sent from another tab after this one read the cooldowns: the server refuses the click (429) with its time. */
  const refusedEmailClick = async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.linked.add("saved_tg");
    await renderCard();
    api.testRetryTimes[ADDRESS.toLowerCase()] = { email: inMinutes(9) };
    await click(testButton("Email"));
  };

  it("answers a click the server refuses (another tab sent first) with when the channel frees up", async () => {
    await refusedEmailClick();
    expect(testButton("Email").textContent).toBe("Again in 9 min (Email)");
    expect(testButton("Email").disabled).toBe(true);
    expect(mocks.toasts).toEqual([expect.stringMatching(/^error: Again in \d+ min$/)]);
    expect(announcement()).toMatch(/^Again in \d+ min$/);
  });

  // The toast counts from the 429's own retryAt: the countdown of the render the click happened in predates it.
  it("says in the toast and the announcement how long the refused channel has to wait", async () => {
    await refusedEmailClick();
    expect(mocks.toasts).toEqual(["error: Again in 9 min"]);
    expect(announcement()).toBe("Again in 9 min");
  });

  it("reports a failed send with the server's reason and leaves the button on to try again", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.linked.add("saved_tg");
    let answer: () => Response | Promise<Response> = () =>
      jsonResponse({ error: "@saved_tg has not pressed Start in @TokenpingTestBot yet" }, 409);
    api.override = ({ method, url }) => (method === "POST" && url === "/api/notifications/test" ? answer() : undefined);
    await renderCard();
    await click(testButton("Telegram"));
    answer = () => new Response("<html>oops</html>", { status: 502 });
    await click(testButton("Telegram"));
    // A 429 without a time to wait for is reported like any refusal.
    answer = () => jsonResponse({ error: "One test message per channel every 15 minutes" }, 429);
    await click(testButton("Telegram"));
    answer = () => Promise.reject(new TypeError("Failed to fetch"));
    await click(testButton("Telegram"));

    expect(mocks.toasts).toEqual([
      "error: @saved_tg has not pressed Start in @TokenpingTestBot yet",
      "error: Failed to send the test message",
      "error: One test message per channel every 15 minutes",
      "error: Failed to fetch",
    ]);
    expect(announcement()).toBe("Failed to fetch");
    expect(testButton("Telegram").textContent).toBe("Send test (Telegram)");
    expect(testButton("Telegram").disabled).toBe(false);
  });

  it("keeps the sending button busy and the other channels off while a test is on its way", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.linked.add("saved_tg");
    const post = deferred<void>();
    api.override = call =>
      call.method === "POST" && call.url === "/api/notifications/test"
        ? post.promise.then(() => route(call))
        : undefined;
    await renderCard();
    await click(testButton("Signal"));

    const sending = screen.getByRole<HTMLButtonElement>("button", { name: "Sending" });
    expect(isBusy(sending)).toBe(true);
    expect(sending.disabled).toBe(false);
    expect(testButton("Email").disabled).toBe(true);
    expect(testButton("Telegram").disabled).toBe(true);
    // A second press while it is on its way sends nothing.
    await click(sending);
    expect(testRequests().filter(request => request.startsWith("POST"))).toHaveLength(1);
    expect(announcement()).toBe("");

    post.resolve();
    await settle();
    expect(testNames()).toEqual([
      ["Send test (Email)", false],
      ["Again in 15 min (Signal)", true],
      ["Send test (Telegram)", false],
    ]);
  });

  it("reads the other wallet's cooldowns after a wallet switch", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: { ...SAVED_CONFIG, services: ["email"] } };
    api.configs[OTHER_ADDRESS.toLowerCase()] = { [MARKET_KEY]: { ...SAVED_CONFIG, services: ["email"] } };
    api.testRetryTimes[ADDRESS.toLowerCase()] = { email: inMinutes(5) };
    const { rerender } = await renderCard();
    expect(testButton("Email").textContent).toBe("Again in 5 min (Email)");

    mocks.address = OTHER_ADDRESS;
    rerender(
      <LocaleProvider locale="en">
        <NotificationConfig {...PROPS} />
      </LocaleProvider>,
    );
    await settle();
    // The session is still the first wallet's: nothing is read for the new one until it signs in.
    expect(testRequests()).toEqual(["GET /api/notifications/test"]);
    await click(button("Sign in with wallet"));
    expect(testButton("Email").textContent).toBe("Send test (Email)");
    expect(testRequests()).toEqual(["GET /api/notifications/test", "GET /api/notifications/test"]);
  });

  it("writes the buttons, the note and every answer in Czech, with no dashes", async () => {
    const DASHES = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.linked.add("saved_tg");
    api.override = ({ method, url, body }) =>
      method === "POST" && url === "/api/notifications/test" && body?.channel === "telegram"
        ? jsonResponse({ error: "Telegram is not configured" }, 503)
        : undefined;
    const { container } = await renderCard({}, "cs");
    expect(testNames()).toEqual([
      ["Poslat test (E-mail)", false],
      ["Poslat test (Signal)", false],
      ["Poslat test (Telegram)", false],
    ]);
    expect(
      screen.getByText("Test pošle toto upozornění a vaši pozici tak, jak jsou teď. Jeden na kanál za 15 minut."),
    ).toBeDefined();

    await click(screen.getByRole("button", { name: "Poslat test (E-mail)" }));
    expect(announcement()).toBe("Testovací zpráva odeslána přes E-mail. Zkontrolujte, že dorazila.");
    expect(testNames()[0]).toEqual(["Znovu za 15 min (E-mail)", true]);

    api.testRetryTimes[ADDRESS.toLowerCase()].signal = inMinutes(3);
    await click(screen.getByRole("button", { name: "Poslat test (Signal)" }));
    expect(testNames()[1]).toEqual(["Znovu za 3 min (Signal)", true]);
    expect(announcement()).toMatch(/^Znovu za \d+ min$/);

    // The server answers in English; a Czech page shows its own message.
    await click(screen.getByRole("button", { name: "Poslat test (Telegram)" }));
    expect(announcement()).toBe("Testovací zprávu se nepodařilo odeslat");
    expect(mocks.toasts).toEqual([
      "success: Testovací zpráva odeslána přes E-mail. Zkontrolujte, že dorazila.",
      expect.stringMatching(/^error: Znovu za \d+ min$/),
      "error: Testovací zprávu se nepodařilo odeslat",
    ]);
    expect(container.textContent).not.toMatch(DASHES);
    expect(container.textContent).not.toMatch(/\b(?:Send|Again|Sending|minutes)\b/);
  });
});

describe("NotificationConfig: attribution prompt", () => {
  const ATTRIBUTION_LABEL = "How did you hear about Tokenping? (optional)";
  const attributionInput = () => screen.queryByRole<HTMLInputElement>("textbox", { name: ATTRIBUTION_LABEL });
  const attributionForm = () => screen.queryByRole("form", { name: ATTRIBUTION_LABEL });

  const createEmailConfig = async () => {
    await click(button("Create alert"));
    await click(serviceToggle("Email"));
    await type(emailInput(), "me@example.com");
    await click(button("Save alert"));
  };

  it("asks once, after the first successful save, and Skip sends nothing", async () => {
    await renderCard();
    expect(attributionInput()).toBeNull();
    await createEmailConfig();
    expect(attributionInput()).not.toBeNull();
    expect(summaryValue("Email")).toBe("me@example.com");

    await click(button("Skip"));
    expect(attributionInput()).toBeNull();
    expect(api.requests.some(request => request.includes("/api/attribution"))).toBe(false);

    await click(button("Edit alert"));
    await click(button("Save alert"));
    expect(mocks.toasts).toEqual(["success: Alert saved", "success: Alert saved"]);
    expect(attributionInput()).toBeNull();
  });

  it("sends the trimmed answer for the connected wallet, then hides the prompt", async () => {
    await renderCard();
    await createEmailConfig();
    await type(attributionInput() as HTMLInputElement, "  A friend in a Telegram group ");
    await click(button("Send answer"));

    expect(lastRequest("POST")).toBe(
      `POST /api/attribution ${JSON.stringify({ answer: "A friend in a Telegram group" })}`,
    );
    expect(api.attribution).toEqual({ [ADDRESS.toLowerCase()]: "A friend in a Telegram group" });
    expect(mocks.toasts).toEqual(["success: Alert saved", "success: Answer sent"]);
    expect(attributionInput()).toBeNull();
  });

  it("moves focus to the prompt after the save, and to the Edit button after Skip", async () => {
    await renderCard();
    await createEmailConfig();
    // The Save button that had focus is gone; the question that replaced it takes focus.
    expect(document.activeElement).toBe(attributionForm());
    await click(button("Skip"));
    expect(document.activeElement).toBe(button("Edit alert"));
  });

  it("moves focus to the Edit button after Send", async () => {
    await renderCard();
    await createEmailConfig();
    await type(attributionInput() as HTMLInputElement, "Reddit");
    await click(button("Send answer"));
    expect(attributionInput()).toBeNull();
    expect(document.activeElement).toBe(button("Edit alert"));
  });

  it("takes focus again after another save while it is still open", async () => {
    await renderCard();
    await createEmailConfig();
    await click(button("Edit alert"));
    await click(button("Save alert"));
    expect(document.activeElement).toBe(attributionForm());
  });

  it("stays open, without taking focus, when a chain switch remounts the card", async () => {
    api.configs[ADDRESS.toLowerCase()] = { "10:v3": { ...SAVED_CONFIG, chainId: 10 } };
    const { rerender } = await renderCard();
    await createEmailConfig();

    // AavePositions keys the card by market, so selecting another market remounts it.
    rerender(<NotificationConfig key="another-chain" {...PROPS} chainId={10} chainName="Optimism" />);
    await settle();
    expect(attributionInput()).not.toBeNull();
    expect(document.activeElement).not.toBe(attributionForm());

    await click(button("Skip"));
    rerender(<NotificationConfig {...PROPS} />);
    await settle();
    expect(attributionInput()).toBeNull();
  });

  it("stays open when a positions refresh takes the card away for a moment", async () => {
    // AavePositions shows a skeleton instead of the card while positions reload.
    const Page = ({ shown }: { shown: boolean }) => (shown ? <NotificationConfig {...PROPS} /> : null);
    const { rerender } = renderWithProviders(<Page shown />);
    await settle();
    await createEmailConfig();
    rerender(<Page shown={false} />);
    await settle();
    rerender(<Page shown />);
    await settle();
    expect(attributionInput()).not.toBeNull();
  });

  it("asks once per browser, so another wallet saving later is not asked", async () => {
    const { rerender } = await renderCard();
    await createEmailConfig();
    await click(button("Skip"));

    mocks.address = OTHER_ADDRESS;
    rerender(<NotificationConfig {...PROPS} />);
    await settle();
    await click(button("Sign in with wallet"));
    await createEmailConfig();
    expect(summaryValue("Email")).toBe("me@example.com");
    expect(attributionInput()).toBeNull();
  });

  it("is hidden while editing and stays until Send or Skip", async () => {
    await renderCard();
    await createEmailConfig();
    await click(button("Edit alert"));
    expect(attributionInput()).toBeNull();
    await click(button("Cancel"));
    expect(attributionInput()).not.toBeNull();
  });

  it("does not ask after a failed save", async () => {
    api.override = ({ method }) => (method === "PUT" ? jsonResponse({ error: "Database error" }, 502) : undefined);
    await renderCard();
    await createEmailConfig();
    expect(mocks.toasts).toEqual(["error: Database error"]);
    expect(attributionInput()).toBeNull();

    // A later successful save still asks: the failed one did not count.
    api.override = () => undefined;
    await click(button("Save alert"));
    expect(attributionInput()).not.toBeNull();
  });

  it("does not ask when this browser was already asked", async () => {
    markAttributionPrompted();
    await renderCard();
    await createEmailConfig();
    expect(mocks.toasts).toEqual(["success: Alert saved"]);
    expect(attributionInput()).toBeNull();
  });
});

describe("NotificationConfig: shared state", () => {
  const HasConfigProbe = () => {
    const { hasConfig, isLoaded } = useNotificationConfig();
    return <p data-testid="probe">{isLoaded ? String(hasConfig({ chainId: CHAIN_ID, market: MARKET })) : "loading"}</p>;
  };

  it("updates other components (the positions list) when a config is created or deleted", async () => {
    renderWithProviders(
      <>
        <HasConfigProbe />
        <NotificationConfig {...PROPS} />
      </>,
    );
    await settle();
    expect(screen.getByTestId("probe").textContent).toBe("false");
    await click(button("Create alert"));
    await click(serviceToggle("Email"));
    await type(emailInput(), "me@example.com");
    await click(button("Save alert"));
    expect(screen.getByTestId("probe").textContent).toBe("true");
    await click(button("Edit alert"));
    await deleteConfig();
    expect(screen.getByTestId("probe").textContent).toBe("false");
    // Through the shared cache: the configs were loaded once and never reloaded.
    expect(api.requests.filter(request => request.startsWith("GET /api/notifications/config"))).toHaveLength(1);
  });

  it("does not show or reuse the previous wallet's settings after a wallet switch", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    let releaseOther: () => void = () => undefined;
    api.override = ({ method, url }) =>
      method === "GET" && url === "/api/notifications/config" && api.session === OTHER_ADDRESS.toLowerCase()
        ? new Promise<Response>(resolve => (releaseOther = () => resolve(jsonResponse({}))))
        : undefined;
    const { rerender } = await renderCard();
    await click(button("Edit alert"));
    expect(emailInput().value).toBe("saved@example.com");

    mocks.address = OTHER_ADDRESS;
    rerender(<NotificationConfig {...PROPS} />);
    await settle();
    // The session is the first wallet's, so the new one has to sign in before anything loads.
    expect(screen.queryByText("Notification settings")).toBeNull();
    expect(emailInput).toThrow();
    await click(button("Sign in with wallet"));
    expect(screen.queryByText("Notification settings")).toBeNull();

    releaseOther();
    await settle();
    await click(button("Create alert"));
    expect(queryEmailInput()).toBeNull();
    expect(serviceToggle("Email").checked).toBe(false);
    expect(thresholdInput().value).toBe("1.50");
  });
});

describe("NotificationConfig: two markets on one chain", () => {
  // Aave V3 and V4's Lido Spoke on Ethereum: one chain, two alerts.
  const LIDO_SPOKE = "0xe1900480ac69f0b296841cd01cc37546d92f35cd";
  const ETHEREUM_V3 = { ...PROPS, chainId: 1, market: "v3", chainName: "Ethereum" };
  const ETHEREUM_LIDO = { ...PROPS, chainId: 1, market: LIDO_SPOKE, chainName: "Ethereum (V4 Lido)" };
  const V3_ALERT = { ...SAVED_CONFIG, chainId: 1, market: "v3", services: ["email"] };

  const MarketsProbe = () => {
    const { hasConfig, isLoaded } = useNotificationConfig();
    const markets = [ETHEREUM_V3, ETHEREUM_LIDO].map(({ chainId, market }) => String(hasConfig({ chainId, market })));
    return <p data-testid="markets">{isLoaded ? markets.join(" ") : "loading"}</p>;
  };
  const markets = () => screen.getByTestId("markets").textContent;

  const renderMarket = (props: typeof ETHEREUM_V3) => (
    <>
      <MarketsProbe />
      <NotificationConfig key={`${props.chainId}:${props.market}`} {...props} />
    </>
  );

  it("creates and deletes the Spoke's alert with its market, leaving the V3 alert on the same chain alone", async () => {
    api.configs[ADDRESS.toLowerCase()] = { "1:v3": V3_ALERT };
    const { rerender } = renderWithProviders(renderMarket(ETHEREUM_LIDO));
    await settle();
    expect(markets()).toBe("true false");
    // The V3 alert on the chain is not the Spoke's.
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("No alerts on Ethereum (V4 Lido) yet");

    await click(button("Create alert"));
    await click(serviceToggle("Email"));
    await type(emailInput(), "lido@example.com");
    await click(button("Save alert"));
    expect(lastPutBody()).toMatchObject({ chainId: 1, market: LIDO_SPOKE, email: "lido@example.com" });
    expect(lastPutBody()).not.toHaveProperty("userId");
    expect(markets()).toBe("true true");
    expect(api.configs[ADDRESS.toLowerCase()]).toMatchObject({
      "1:v3": V3_ALERT,
      [`1:${LIDO_SPOKE}`]: { chainId: 1, market: LIDO_SPOKE, email: "lido@example.com" },
    });

    // Selecting the V3 market shows its own saved alert.
    rerender(renderMarket(ETHEREUM_V3));
    await settle();
    expect(summaryValue("Email")).toBe("saved@example.com");

    rerender(renderMarket(ETHEREUM_LIDO));
    await settle();
    expect(summaryValue("Email")).toBe("lido@example.com");
    await click(button("Edit alert"));
    await deleteConfig();
    expect(lastRequest("DELETE")).toBe(`DELETE /api/notifications/config {"chainId":1,"market":"${LIDO_SPOKE}"}`);
    expect(markets()).toBe("true false");
    expect(Object.keys(api.configs[ADDRESS.toLowerCase()])).toEqual(["1:v3"]);
  });

  it("sends the V3 market with a save and a delete on the V3 card, keeping the Spoke's alert", async () => {
    const lidoAlert = { ...V3_ALERT, market: LIDO_SPOKE, email: "lido@example.com" };
    api.configs[ADDRESS.toLowerCase()] = { "1:v3": V3_ALERT, [`1:${LIDO_SPOKE}`]: lidoAlert };
    renderWithProviders(renderMarket(ETHEREUM_V3));
    await settle();
    expect(markets()).toBe("true true");
    expect(summaryValue("Email")).toBe("saved@example.com");

    await click(button("Edit alert"));
    await type(emailInput(), "v3@example.com");
    await click(button("Save alert"));
    expect(lastPutBody()).toMatchObject({ chainId: 1, market: "v3", email: "v3@example.com" });

    await click(button("Edit alert"));
    await deleteConfig();
    expect(lastRequest("DELETE")).toBe(`DELETE /api/notifications/config {"chainId":1,"market":"v3"}`);
    expect(markets()).toBe("false true");
    expect(api.configs[ADDRESS.toLowerCase()]).toEqual({ [`1:${LIDO_SPOKE}`]: lidoAlert });
  });
});

describe("NotificationConfig: accessibility", () => {
  it("labels and describes every control and hides decorative icons", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.linked.add("saved_tg");
    const { container } = await renderCard();
    await click(button("Edit alert"));

    const services = screen.getByRole("group", { name: "Notification services" });
    const toggles = within(services).getAllByRole<HTMLInputElement>("checkbox");
    expect(toggles.map(toggle => [toggle.labels?.[0]?.textContent, toggle.checked])).toEqual([
      ["Email", true],
      ["Signal", true],
      ["Telegram", true],
    ]);
    await click(toggles[1]);
    expect(toggles[1].checked).toBe(false);

    expect(screen.getByLabelText("Email address")).toBe(emailInput());
    expect(emailInput().required).toBe(true);
    expect(document.getElementById(emailInput().getAttribute("aria-describedby") ?? "")?.textContent).toBe(
      "Alerts are sent to this address.",
    );
    await click(toggles[1]);
    expect(screen.getByLabelText("Signal username")).toBe(signalInput());
    // A static name; the value is the value text, so the two cannot contradict each other.
    expect(screen.getByRole("slider", { name: "Health factor threshold" })).toBe(slider());
    expect(slider().getAttribute("aria-valuetext")).toBe("1.8");
    for (const control of [slider(), thresholdInput()]) {
      expect(document.getElementById(control.getAttribute("aria-describedby") ?? "")?.textContent).toBe(
        "You'll be notified when your health factor drops below 1.8 on Arbitrum.",
      );
    }
    expect(screen.getByLabelText("Telegram username")).toBe(telegramInput());
    expect(telegramInput().required).toBe(true);
    expect(document.getElementById(telegramInput().getAttribute("aria-describedby") ?? "")?.textContent).toBe(
      "Alerts go to this Telegram account. Find it in Telegram under Settings, then Username.",
    );
    expect(telegramStatus().textContent).toBe("@saved_tg is linked: alerts will arrive in your Telegram chat.");
    expect(container.querySelectorAll("label:not([for])")).toHaveLength(0);

    const icons = [...container.querySelectorAll("svg")];
    expect(icons.length).toBeGreaterThan(0);
    expect(icons.every(icon => icon.getAttribute("aria-hidden") === "true")).toBe(true);
  });

  it("keeps one h3 in every state for the dashboard outline, titled by the empty state on first use", async () => {
    const { unmount } = await renderCard();
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("No alerts on Arbitrum yet");
    await click(button("Create alert"));
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("Notification settings");
    unmount();

    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    mocks.hasAccess = false;
    await renderCard();
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("Notification settings");
  });
});

describe("NotificationConfig: brand", () => {
  // En and em dash, built from their code points so this file does not contain them, even as escapes.
  const DASHES = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
  // A Tailwind palette colour, black or white, an arbitrary colour value or a DaisyUI base colour: the card uses the
  // semantic tokens only, so both themes and the contrast checks follow.
  const OFF_TOKEN_CLASS =
    /(?:^|:)(?:text|bg|border|from|via|to|ring|outline|fill|stroke|shadow|accent|decoration|placeholder)-(?:(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d|white|black|base-|\[(?:#|rgb|hsl|oklch))/;

  /** Collects brand problems across the states it is shown, and the number of pink elements in each. */
  const brandScanner = () => {
    const problems: string[] = [];
    const pinkCounts: Record<string, number> = {};
    const scan = (name: string, root: HTMLElement) => {
      const elements = [root, ...root.querySelectorAll("[class]")];
      for (const element of elements) {
        for (const token of (element.getAttribute("class") ?? "").split(/\s+/)) {
          if (OFF_TOKEN_CLASS.test(token)) problems.push(`${name}: ${token}`);
        }
      }
      const text = root.textContent ?? "";
      if (/\p{Extended_Pictographic}/u.test(text)) problems.push(`${name}: emoji in "${text}"`);
      if (/\.\.\.|\u2026/.test(text)) problems.push(`${name}: trailing dots in "${text}"`);
      if (DASHES.test(text)) problems.push(`${name}: dash in "${text}"`);
      pinkCounts[name] = elements.filter(isPink).length;
    };
    return { problems, pinkCounts, scan };
  };

  it("uses tokens only and shows one pink primary, Save, while editing", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.linked.add("saved_tg");
    const { problems, pinkCounts, scan } = brandScanner();
    const { container } = await renderCard();
    scan("summary", container);
    await click(button("Edit alert"));
    scan("edit", container);
    expect(isPink(button("Save alert"))).toBe(true);
    await click(serviceToggle("Email"));
    await click(serviceToggle("Signal"));
    await click(serviceToggle("Telegram"));
    await click(button("Save alert"));
    scan("errors", container);
    await click(serviceToggle("Telegram"));
    await type(telegramInput(), "new_name");
    await settle(400);
    expect(telegramStatus().textContent).toMatch(/^Not linked yet/);
    scan("not linked", container);
    await click(button("Delete alert"));
    scan("confirm delete", container);
    await click(confirmation().getByRole("button", { name: "Delete alert" }));
    await click(button("Cancel"));
    scan("empty", container);
    expect(isPink(button("Create alert"))).toBe(true);
    expect(problems).toEqual([]);
    expect(pinkCounts).toEqual({
      summary: 0,
      edit: 1,
      errors: 1,
      "not linked": 1,
      "confirm delete": 0,
      empty: 1,
    });
  });

  it("uses tokens only in the attribution prompt, also when sending fails, without a pink button", async () => {
    api.override = ({ url }) =>
      url === "/api/attribution" ? jsonResponse({ error: "Database error" }, 502) : undefined;
    const { problems, pinkCounts, scan } = brandScanner();
    const { container } = await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Email"));
    await type(emailInput(), "me@example.com");
    await click(button("Save alert"));
    scan("prompt", container);
    await type(screen.getByRole("textbox", { name: "How did you hear about Tokenping? (optional)" }), "Reddit");
    await click(button("Send answer"));
    expect(screen.getByRole("alert").textContent).toBe("Couldn't send your answer. Try again or skip.");
    scan("prompt error", container);
    expect(problems).toEqual([]);
    expect(pinkCounts).toEqual({ prompt: 0, "prompt error": 0 });
  });

  it("uses tokens only in the read-only, load error and unknown link states", async () => {
    mocks.hasAccess = false;
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    const { problems, pinkCounts, scan } = brandScanner();
    const readOnly = await renderCard();
    // saved_tg has not pressed Start, so the summary shows its warning too.
    expect(notLinkedWarning()).not.toBeNull();
    scan("read-only", readOnly.container);
    readOnly.unmount();

    api.override = ({ method, url }) =>
      method === "GET" && url.startsWith("/api/notifications/config") ? jsonResponse({}, 500) : undefined;
    const failed = await renderCard();
    scan("load error", failed.container);
    failed.unmount();

    mocks.hasAccess = true;
    api.override = ({ method, url }) =>
      method === "GET" && url.startsWith("/api/telegram/status") ? jsonResponse({}, 500) : undefined;
    const unknownLink = await renderCard();
    await click(button("Edit alert"));
    await settle(1000);
    expect(telegramStatus().textContent).toBe("Couldn't check whether this username is linked. You can still save.");
    scan("unknown link", unknownLink.container);
    expect(problems).toEqual([]);
    expect(pinkCounts).toEqual({ "read-only": 0, "load error": 0, "unknown link": 1 });
  });
});

describe("NotificationConfig: language", () => {
  const DASHES = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
  /** The language of each config the card handed to the API client. */
  const savedLocales = (upsert: { mock: { calls: [NotificationConfigType][] } }) =>
    upsert.mock.calls.map(([config]) => config.locale);
  const czechThresholdInput = () =>
    screen.getByRole<HTMLInputElement>("textbox", { name: "Prahová hodnota health factoru (přesná hodnota)" });

  it("saves the page's language with the config: English at the root", async () => {
    const upsert = vi.spyOn(notificationConfigClient, "upsertConfig");
    await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Email"));
    await type(emailInput(), "me@example.com");
    await click(button("Save alert"));
    expect(savedLocales(upsert)).toEqual(["en"]);
  });

  it("creates an alert in Czech: labels, errors, a decimal comma, and the language saved with it", async () => {
    const upsert = vi.spyOn(notificationConfigClient, "upsertConfig");
    await renderCard({}, "cs");
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(
      "Na síti Arbitrum zatím nemáte žádné upozornění",
    );
    await click(button("Vytvořit upozornění"));
    expect(screen.getByRole("group", { name: "Kanály upozornění" })).toBeDefined();

    await click(button("Uložit upozornění"));
    expect(alerts()).toEqual(["Vyberte alespoň jeden kanál upozornění."]);
    await click(screen.getByRole("checkbox", { name: "E-mail" }));
    const czechEmail = () => screen.getByRole<HTMLInputElement>("textbox", { name: "E-mailová adresa" });
    expect(czechEmail().placeholder).toBe("jmeno@example.com");
    await type(czechEmail(), "nope");
    await click(screen.getByRole("checkbox", { name: "Signal" }));
    await click(button("Uložit upozornění"));
    expect(errorSummary()?.textContent).toBe(
      "Před uložením opravte 2 pole" +
        "Zadejte e-mailovou adresu ve tvaru jmeno@example.com." +
        "Zadejte své uživatelské jméno v Signalu.",
    );
    await type(czechEmail(), "me@example.com");
    await type(screen.getByRole("textbox", { name: "Uživatelské jméno v Signalu" }), "alice.42");

    // The threshold reads and takes a decimal comma; a dot still works.
    expect(czechThresholdInput().value).toBe("1,50");
    expect(screen.getByText("Kritický")).toBeDefined();
    expect(screen.getByText("1,1")).toBeDefined();
    await type(czechThresholdInput(), "1,7");
    expect([czechThresholdInput().value, slider().value]).toEqual(["1,7", "1.7"]);
    expect(slider().getAttribute("aria-valuetext")).toBe("1,7");
    expect(screen.getByText(/^Upozorníme vás/).textContent).toBe(
      "Upozorníme vás, když váš health factor na síti Arbitrum klesne pod 1,7.",
    );
    await type(czechThresholdInput(), "2.25");
    expect(czechThresholdInput().value).toBe("2,25");
    await type(czechThresholdInput(), "1,8");
    fireEvent.blur(czechThresholdInput());
    expect(czechThresholdInput().value).toBe("1,80");

    await click(button("Uložit upozornění"));
    expect(mocks.toasts).toEqual(["success: Upozornění uloženo"]);
    expect(announcement()).toBe("Upozornění uloženo");
    expect(savedLocales(upsert)).toEqual(["cs"]);
    expect(upsert.mock.calls[0][0]).toMatchObject({ healthFactorThreshold: 1.8, locale: "cs" });
    expect(lastPutBody()).toMatchObject({ healthFactorThreshold: 1.8 });
    expect([undefined, "cs"]).toContain(lastPutBody().locale);

    expect(summaryValue("Kanály")).toBe("E-mailSignal");
    expect(summaryValue("E-mail")).toBe("me@example.com");
    expect(summaryValue("Práh")).toBe("1,8");
    // The first save asks the attribution question, in Czech too.
    expect(screen.getByRole("form", { name: "Jak jste se o Tokenpingu dozvěděli? (nepovinné)" })).toBeDefined();
    await click(button("Odeslat odpověď"));
    expect(alerts()).toEqual(["Napište odpověď, nebo vyberte Přeskočit."]);
    await click(button("Přeskočit"));
    expect(button("Upravit upozornění")).toBeDefined();
  });

  it("starts each new channel in the page's language, saves each channel's pick and shows it in the summary", async () => {
    await renderCard({}, "cs");
    await click(button("Vytvořit upozornění"));
    await click(screen.getByRole("checkbox", { name: "E-mail" }));
    await click(screen.getByRole("checkbox", { name: "Signal" }));
    const emailLanguage = () => screen.getByRole<HTMLSelectElement>("combobox", { name: "Jazyk e-mailů" });
    const signalLanguage = () => screen.getByRole<HTMLSelectElement>("combobox", { name: "Jazyk zpráv na Signalu" });
    expect([emailLanguage().value, signalLanguage().value]).toEqual(["cs", "cs"]);
    // Each language is named in itself.
    expect([...signalLanguage().options].map(option => [option.value, option.text, option.lang])).toEqual([
      ["en", "English", "en"],
      ["cs", "Čeština", "cs"],
    ]);

    await type(screen.getByRole("textbox", { name: "E-mailová adresa" }), "me@example.com");
    await type(screen.getByRole("textbox", { name: "Uživatelské jméno v Signalu" }), "alice.42");
    fireEvent.change(signalLanguage(), { target: { value: "en" } });
    await settle();
    await click(button("Uložit upozornění"));

    expect(lastPutBody()).toMatchObject({ locale: "cs", channelLocales: { email: "cs", signal: "en" } });
    const summaryRow = (label: string) =>
      screen.getAllByText(label, { selector: "dt" })[0].nextElementSibling?.textContent;
    expect(summaryRow("E-mail")).toContain("Jazyk: Čeština");
    expect(summaryRow("Signal")).toContain("Jazyk: English");
  });

  it("keeps a saved channel's language on a page in another language, and lets an edit change it", async () => {
    api.configs[ADDRESS.toLowerCase()] = {
      [MARKET_KEY]: { ...SAVED_CONFIG, services: ["email"], locale: "cs", channelLocales: { email: "cs" } },
    };
    await renderCard();
    expect(screen.getAllByText("Email", { selector: "dt" })[0].nextElementSibling?.textContent).toContain(
      "Language: Čeština",
    );

    await click(button("Edit alert"));
    const emailLanguage = () => screen.getByRole<HTMLSelectElement>("combobox", { name: "Email language" });
    expect(emailLanguage().value).toBe("cs");
    await click(serviceToggle("Telegram"));
    await type(telegramInput(), "alice_eth");
    // A channel added on an English page starts in English; the saved one keeps Czech until it is changed.
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Telegram language" }).value).toBe("en");
    await click(button("Save alert"));
    expect(lastPutBody()).toMatchObject({ locale: "en", channelLocales: { email: "cs", telegram: "en" } });

    await click(button("Edit alert"));
    fireEvent.change(emailLanguage(), { target: { value: "en" } });
    await settle();
    await click(button("Save alert"));
    expect(lastPutBody()).toMatchObject({ channelLocales: { email: "en", telegram: "en" } });
    // Cancel drops an unsaved change.
    await click(button("Edit alert"));
    fireEvent.change(emailLanguage(), { target: { value: "cs" } });
    await click(button("Cancel"));
    await click(button("Edit alert"));
    expect(emailLanguage().value).toBe("en");
  });

  it("shows a saved alert, the delete confirmation and failures in Czech", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: { ...SAVED_CONFIG, services: ["email"] } };
    api.override = ({ method }) =>
      method === "PUT"
        ? jsonResponse({ error: "Active paid access required to update notification config" }, 403)
        : undefined;
    await renderCard({}, "cs");
    expect(screen.getByText("Nastavení upozornění")).toBeDefined();
    expect(screen.getByText("Aktivní")).toBeDefined();
    expect(screen.getByText("Pod prahem vašeho upozornění")).toBeDefined();
    expect(screen.getByText("Váš aktuální health factor (1,20) je pod vaším prahem 1,8.")).toBeDefined();

    await click(button("Upravit upozornění"));
    // The server answers in English; a Czech page shows its own message.
    await click(button("Uložit upozornění"));
    expect(mocks.toasts).toEqual(["error: Upozornění se nepodařilo uložit"]);
    expect(announcement()).toBe("Upozornění se nepodařilo uložit");

    await click(button("Smazat upozornění"));
    const group = within(screen.getByRole("group", { name: "Smazat toto upozornění?" }));
    expect(group.getByText("Tokenping přestane posílat upozornění na health factor pro síť Arbitrum.")).toBeDefined();
    expect(document.activeElement).toBe(group.getByRole("button", { name: "Ponechat upozornění" }));
    await click(group.getByRole("button", { name: "Smazat upozornění" }));
    expect(announcement()).toBe("Upozornění smazáno");
    expect(button("Zrušit")).toBeDefined();
  });

  it("writes Telegram, the read-only and the load error states in Czech, with no dashes anywhere", async () => {
    const texts: string[] = [];
    const czechTelegramInput = () =>
      screen.getByRole<HTMLInputElement>("textbox", { name: "Uživatelské jméno na Telegramu" });
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: { ...SAVED_CONFIG, services: ["telegram"] } };
    api.override = ({ url }) => (url.startsWith("/api/telegram/status") ? jsonResponse({}, 500) : undefined);
    const card = await renderCard({}, "cs");
    await click(button("Upravit upozornění"));
    expect(czechTelegramInput().value).toBe("saved_tg");
    await settle(1000);
    expect(telegramStatus().textContent).toBe(
      "Nepodařilo se ověřit, jestli je toto jméno propojené. Uložit můžete i tak.",
    );
    texts.push(card.container.textContent ?? "");

    await type(czechTelegramInput(), "");
    await click(button("Uložit upozornění"));
    expect(fieldErrors()).toEqual(["Zadejte své uživatelské jméno na Telegramu."]);
    await type(czechTelegramInput(), "rom");
    expect(fieldErrors()).toEqual([
      "Zadejte uživatelské jméno na Telegramu ve tvaru alice_eth: 4 až 32 písmen, číslic nebo podtržítek, na začátku písmeno a na konci ne _.",
    ]);
    texts.push(card.container.textContent ?? "");

    api.override = () => undefined;
    await type(czechTelegramInput(), "@Novy_Ucet");
    expect(telegramStatus().textContent).toBe("Ověřujeme");
    await settle(400);
    expect(telegramStatus().textContent).toBe(
      `Zatím nepropojeno: jednou stiskněte Start v @${BOT}.Otevřít @${BOT} (otevře se v nové kartě)`,
    );
    texts.push(card.container.textContent ?? "");

    await click(button("Uložit upozornění"));
    expect(summaryValue("Telegram")).toBe("@novy_ucet");
    expect(noteStartingWith("Zatím nepropojeno")?.textContent).toBe(
      `Zatím nepropojeno: jednou stiskněte Start v @${BOT}.Otevřít @${BOT} (otevře se v nové kartě)`,
    );
    texts.push(card.container.textContent ?? "");

    api.linked.add("novy_ucet");
    await click(button("Upravit upozornění"));
    expect(telegramStatus().textContent).toBe(
      "Propojeno: @novy_ucet. Upozornění budou chodit do vašeho chatu na Telegramu.",
    );
    texts.push(card.container.textContent ?? "");
    card.unmount();

    mocks.hasAccess = false;
    const readOnly = await renderCard({}, "cs");
    expect(screen.getByText("Pro úpravy zaplaťte přístup")).toBeDefined();
    texts.push(readOnly.container.textContent ?? "");
    readOnly.unmount();

    api.override = ({ method, url }) =>
      method === "GET" && url.startsWith("/api/notifications/config") ? jsonResponse({}, 500) : undefined;
    const failed = await renderCard({}, "cs");
    expect(screen.getByRole("alert").textContent).toBe("Nastavení upozornění se nenačetlo");
    expect(screen.getByText("Zkontrolujte připojení a zkuste to znovu.")).toBeDefined();
    texts.push(failed.container.textContent ?? "");

    for (const text of texts) {
      expect(text).not.toMatch(DASHES);
      expect(text).not.toMatch(/\b(?:Save|Delete|Cancel|Connect|Alert|Threshold|Checking|linked)\b/);
    }
  });
});
