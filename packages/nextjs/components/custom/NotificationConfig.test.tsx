// @vitest-environment jsdom
import { notifyManager } from "@tanstack/react-query";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationConfig } from "~~/components/custom/NotificationConfig";
import { markAttributionPrompted } from "~~/components/custom/notifications/attributionPromptState";
import { useNotificationConfig } from "~~/hooks/custom/useNotificationConfig";
import { LocaleProvider } from "~~/i18n/LocaleProvider";
import type { Locale } from "~~/i18n/locales";
import { notificationConfigClient } from "~~/services/notifications/notificationConfigClient";
import type { NotificationConfig as NotificationConfigType, TelegramLinkStatus } from "~~/types/notifications";
import { deferred, jsonResponse } from "~~/utils/testing/helpers";
import { renderWithProviders } from "~~/utils/testing/providers";

/*
 * The notification settings card against its real hooks and API clients, with a small in-memory API behind a mocked
 * `fetch`. Timers are fake so the Telegram polling can be stepped through.
 */

const mocks = vi.hoisted(() => ({
  address: undefined as string | undefined,
  hasAccess: true,
  toasts: [] as string[],
  wagmiConfig: {},
}));

// useAccount and getAccount read the same wagmi state: the connected wallet.
vi.mock("wagmi", () => ({ useAccount: () => ({ address: mocks.address }), useConfig: () => mocks.wagmiConfig }));
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
const DEEP_LINK = "https://t.me/bot?start=tok";
const LINK_TOKEN = {
  token: "tok",
  botUsername: "bot",
  expiresAt: new Date(NOW + 10 * 60 * 1000).toISOString(),
  deepLink: DEEP_LINK,
};
/** The server issues LINK_TOKEN at NOW by its own clock, which it reports in the Date header. */
const linkTokenResponse = () =>
  new Response(JSON.stringify(LINK_TOKEN), {
    headers: { "Content-Type": "application/json", Date: new Date(NOW).toUTCString() },
  });

const SAVED_CONFIG = {
  chainId: CHAIN_ID,
  market: MARKET,
  enabled: true,
  services: ["email", "signal", "telegram"],
  healthFactorThreshold: 1.8,
  email: "saved@example.com",
  signalRecipient: "saved.01",
};
const SAVED_LINK: TelegramLinkStatus = { linked: true, chatId: "555", username: "saved_tg", linkedAt: "then" };

type Call = { method: string; url: string; body?: Record<string, unknown> };

/** In-memory API state, keyed by lowercased wallet. `override` answers a request instead (failures, slow responses). */
const api = {
  configs: {} as Record<string, Record<string, unknown>>,
  links: {} as Record<string, TelegramLinkStatus>,
  attribution: {} as Record<string, unknown>,
  requests: [] as string[],
  override: (() => undefined) as (call: Call) => Response | Promise<Response> | undefined,
};

const userOf = (url: string) => (new URL(url, "http://test").searchParams.get("userId") ?? "").toLowerCase();

const route = ({ method, url, body }: Call) => {
  const path = url.split("?")[0];
  const user = String(body?.userId ?? "").toLowerCase();
  if (path === "/api/notifications/config") {
    if (method === "GET") return jsonResponse(api.configs[userOf(url)] ?? {});
    const chainId = Number(body?.chainId);
    // Like the server: keyed by chain and market, "v3" when the body has none.
    const market = String(body?.market ?? "v3");
    const key = `${chainId}:${market}`;
    if (method === "PUT") {
      const { enabled, services, healthFactorThreshold, email, signalRecipient } = body ?? {};
      const config = { chainId, market, enabled, services, healthFactorThreshold };
      api.configs[user] = {
        ...api.configs[user],
        [key]: { ...config, ...(email ? { email } : {}), ...(signalRecipient ? { signalRecipient } : {}) },
      };
    }
    if (method === "DELETE") delete api.configs[user]?.[key];
    return jsonResponse({ success: true });
  }
  if (path === "/api/telegram/link") {
    if (method === "GET") return jsonResponse(api.links[userOf(url)] ?? { linked: false });
    delete api.links[user];
    return jsonResponse({ success: true });
  }
  if (path === "/api/telegram/link-token") return linkTokenResponse();
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

let popup: { opener: unknown; location: { href: string }; close: ReturnType<typeof vi.fn> };
let openSpy: ReturnType<typeof vi.spyOn>;
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
const serviceToggle = (name: "Email" | "Signal" | "Telegram") =>
  screen.getByRole<HTMLInputElement>("checkbox", { name });
const emailInput = () => screen.getByRole<HTMLInputElement>("textbox", { name: "Email address" });
const queryEmailInput = () => screen.queryByRole<HTMLInputElement>("textbox", { name: "Email address" });
const signalInput = () => screen.getByRole<HTMLInputElement>("textbox", { name: "Signal username" });
const slider = () => screen.getByRole<HTMLInputElement>("slider");
const thresholdInput = () =>
  screen.getByRole<HTMLInputElement>("textbox", { name: "Health factor threshold (exact value)" });
/** The value next to a summary label such as "Telegram". */
const summaryValue = (label: string) =>
  screen.queryAllByText(label, { selector: "dt" })[0]?.nextElementSibling?.textContent ?? null;
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
/** The card's polite live region: what happened to the last Save, Delete or attribution answer. */
const announcement = () => document.querySelector("[aria-live='polite']")?.textContent ?? null;
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
  mocks.hasAccess = true;
  mocks.toasts = [];
  api.configs = {};
  api.links = {};
  api.attribution = {};
  api.requests = [];
  // The attribution prompt remembers in localStorage that this browser was asked.
  window.localStorage.clear();
  api.override = () => undefined;
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"], now: NOW });
  vi.stubGlobal("fetch", fetchMock);
  // Telegram is offered only when the bot is configured, as in production once the bot is set up.
  vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "TokenpingTestBot");
  popup = { opener: window, location: { href: "" }, close: vi.fn() };
  openSpy = vi.spyOn(window, "open").mockImplementation(() => popup as unknown as Window);
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

  it("shows a read-only summary, with the Telegram link from the link API, when access lapsed", async () => {
    mocks.hasAccess = false;
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.links[ADDRESS.toLowerCase()] = SAVED_LINK;
    const { rerender } = await renderCard();
    expect(screen.getByText("Pay for access to edit")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Edit alert" })).toBeNull();
    expect(screen.getByText("Active")).toBeDefined();
    expect(summaryValue("Email")).toBe("saved@example.com");
    expect(summaryValue("Signal")).toBe("@saved.01");
    expect(summaryValue("Telegram")).toBe("@saved_tg");
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
      userId: ADDRESS,
      chainId: CHAIN_ID,
      market: MARKET,
      enabled: true,
      services: ["email", "signal"],
      healthFactorThreshold: 2.5,
      email: "me@example.com",
      signalRecipient: "alice.42",
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
      "Connect Telegram before you save.",
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
    expect(document.activeElement).toBe(button("Connect Telegram"));

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
    expect(api.requests.some(request => request.startsWith("PUT"))).toBe(false);

    // Another failed Save focuses the summary again; fixing a field takes it off the list.
    await type(emailInput(), "me@example.com");
    expect(within(summary).getByText("Fix 2 fields to save")).toBeDefined();
    await click(button("Save alert"));
    expect(document.activeElement).toBe(errorSummary());
    expect(within(errorSummary() as HTMLElement).getAllByRole("link")).toHaveLength(2);
  });

  it("opens Telegram inside the Connect click and offers the bot link until the chat is linked", async () => {
    await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    await click(button("Save alert"));
    expect(alerts()).toEqual(["Connect Telegram before you save."]);
    expect(document.activeElement).toBe(button("Connect Telegram"));

    fireEvent.click(button("Connect Telegram"));
    expect(openSpy.mock.calls).toEqual([["", "_blank"]]);
    await settle();
    expect(popup.location.href).toBe(DEEP_LINK);
    expect(isBusy(button("Waiting for Telegram"))).toBe(true);
    const openLink = screen.getByRole("link", { name: "Open Telegram (opens in a new tab)" });
    expect([openLink.getAttribute("href"), openLink.getAttribute("target"), openLink.getAttribute("rel")]).toEqual([
      DEEP_LINK,
      "_blank",
      "noopener noreferrer",
    ]);

    api.links[ADDRESS.toLowerCase()] = { linked: true, chatId: "777", username: "bob", linkedAt: "now" };
    await settle(2000);
    expect(screen.getByText("Connected as @bob")).toBeDefined();
    expect(screen.queryByRole("link", { name: /Open Telegram/ })).toBeNull();
    // The link fixed the field, so its error is gone.
    expect(alerts()).toEqual([]);
    expect(mocks.toasts).toEqual(["success: Telegram connected as @bob"]);
  });

  it("keeps a Telegram link made while editing after Save", async () => {
    await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    await click(button("Connect Telegram"));
    api.links[ADDRESS.toLowerCase()] = { linked: true, chatId: "777", username: "bob", linkedAt: "now" };
    await settle(2000);
    await click(button("Save alert"));
    expect(lastRequest("PUT")).toContain('"services":["telegram"]');

    // B0.0: the link is read from the link API, so saving a config cannot drop it.
    expect(summaryValue("Telegram")).toBe("@bob");
    await click(button("Edit alert"));
    expect(screen.getByText("Connected as @bob")).toBeDefined();
    await click(button("Save alert"));
    expect(api.requests.filter(request => request.startsWith("PUT"))).toHaveLength(2);
  });

  it("shows a wallet's existing Telegram link when creating a config on another chain", async () => {
    api.links[ADDRESS.toLowerCase()] = SAVED_LINK;
    await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    expect(screen.getByText("Connected as @saved_tg")).toBeDefined();
    await click(button("Save alert"));
    expect(lastRequest("PUT")).toContain('"services":["telegram"]');
    expect(mocks.toasts).toEqual(["success: Alert saved"]);
    expect(summaryValue("Telegram")).toBe("@saved_tg");
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
    expect(lastRequest("DELETE")).toBe(
      `DELETE /api/notifications/config {"userId":"${ADDRESS}","chainId":${CHAIN_ID},"market":"${MARKET}"}`,
    );
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

  it("requires a connected wallet for Telegram and for saving", async () => {
    mocks.address = undefined;
    await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    await click(button("Connect Telegram"));
    expect(openSpy).not.toHaveBeenCalled();
    await click(serviceToggle("Telegram"));
    await click(serviceToggle("Email"));
    await type(emailInput(), "me@example.com");
    await click(button("Save alert"));
    expect(mocks.toasts).toEqual(["error: Connect your wallet first", "error: Wallet not connected"]);
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

  it("reports Telegram connect and disconnect failures", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.links[ADDRESS.toLowerCase()] = SAVED_LINK;
    api.override = ({ method, url }) => {
      if (method === "DELETE" && url === "/api/telegram/link") return jsonResponse({ error: "Database error" }, 500);
      if (method === "POST") return jsonResponse({ error: "Telegram is not configured on this server" }, 503);
      return undefined;
    };
    await renderCard();
    await click(button("Edit alert"));
    await click(button("Disconnect Telegram"));
    expect(screen.getByText("Connected as @saved_tg")).toBeDefined();

    api.links = {};
    api.override = ({ method }) =>
      method === "POST" ? jsonResponse({ error: "Telegram is not configured on this server" }, 503) : undefined;
    await click(button("Disconnect Telegram"));
    await click(button("Connect Telegram"));
    expect(popup.close).toHaveBeenCalledTimes(1);
    expect(button("Connect Telegram")).toBeDefined();
    expect(mocks.toasts).toEqual([
      "error: Database error",
      "success: Telegram disconnected",
      "error: Telegram is not configured on this server",
    ]);
  });
});

describe("NotificationConfig: Telegram handshake", () => {
  it("stays disconnected after Disconnect and Cancel", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.links[ADDRESS.toLowerCase()] = SAVED_LINK;
    await renderCard();
    await click(button("Edit alert"));
    await click(button("Disconnect Telegram"));
    expect(button("Connect Telegram")).toBeDefined();
    await click(button("Cancel"));
    expect(summaryValue("Telegram")).toBeNull();
    await click(button("Edit alert"));
    expect(button("Connect Telegram")).toBeDefined();
  });

  it("waits until the link token expires before giving up", async () => {
    await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    await click(button("Connect Telegram"));
    await settle(5 * 60 * 1000);
    expect(button("Waiting for Telegram")).toBeDefined();
    await settle(5 * 60 * 1000);
    expect(button("Connect Telegram")).toBeDefined();
    expect(mocks.toasts).toEqual(["error: Telegram link timed out. Try again."]);
  });

  it("keeps waiting for the token's full lifetime when the device clock runs ahead of the server", async () => {
    // By this device's clock the token (valid until NOW + 10 min by the server's clock) expired 5 minutes ago.
    vi.setSystemTime(NOW + 15 * 60 * 1000);
    await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    await click(button("Connect Telegram"));
    await settle(5 * 60 * 1000);
    expect(button("Waiting for Telegram")).toBeDefined();
    expect(mocks.toasts).toEqual([]);

    api.links[ADDRESS.toLowerCase()] = { linked: true, chatId: "777", username: "bob", linkedAt: "now" };
    await settle(2000);
    expect(screen.getByText("Connected as @bob")).toBeDefined();
    expect(mocks.toasts).toEqual(["success: Telegram connected as @bob"]);
  });

  it("offers Try again instead of Connect when the Telegram link cannot be checked, keeping the card on screen", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.links[ADDRESS.toLowerCase()] = SAVED_LINK;
    let linkStatus: (call: Call) => Response | Promise<Response> = () =>
      jsonResponse({ error: "Failed to read the Telegram link" }, 500);
    api.override = call =>
      call.method === "GET" && call.url.startsWith("/api/telegram/link?") ? linkStatus(call) : undefined;
    await renderCard();
    expect(summaryValue("Email")).toBe("saved@example.com");
    await click(button("Edit alert"));

    const field = within(screen.getByRole("group", { name: "Telegram" }));
    expect(field.getByRole("alert").textContent).toBe("Couldn't check your Telegram link");
    expect(field.queryByRole("button", { name: "Connect Telegram" })).toBeNull();
    // Save asks for Try again instead of saving a config whose Telegram link is unknown.
    await click(button("Save alert"));
    expect(field.getAllByRole("alert").map(alert => alert.textContent)).toEqual([
      "Couldn't check your Telegram link",
      "Select Try again to check your Telegram link, then save.",
    ]);
    // Five fields, so the summary takes focus; its link leads to the Try again button.
    expect(document.activeElement).toBe(errorSummary());
    await click(within(errorSummary() as HTMLElement).getByRole("link"));
    expect(document.activeElement).toBe(field.getByRole("button", { name: "Try again" }));
    expect(lastRequest("PUT")).toBeUndefined();

    const retry = deferred<void>();
    linkStatus = call => retry.promise.then(() => route(call));
    await click(field.getByRole("button", { name: "Try again" }));
    expect(isBusy(field.getByRole("button", { name: "Retrying" }))).toBe(true);
    expect(field.getAllByRole("alert")).toHaveLength(2);

    retry.resolve();
    await settle();
    expect(field.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Connected as @saved_tg")).toBeDefined();
    expect(mocks.toasts).toEqual([]);
    await click(button("Save alert"));
    expect(lastRequest("PUT")).toContain('"services":["email","signal","telegram"]');
  });

  it("offers Connect after a successful Try again for a wallet without a link", async () => {
    let linkStatus: (call: Call) => Response | Promise<Response> = () =>
      jsonResponse({ error: "Failed to read the Telegram link" }, 500);
    api.override = call =>
      call.method === "GET" && call.url.startsWith("/api/telegram/link?") ? linkStatus(call) : undefined;
    await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    expect(screen.queryByRole("button", { name: "Connect Telegram" })).toBeNull();

    linkStatus = route;
    await click(button("Try again"));
    expect(button("Connect Telegram")).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps the card on screen while a failed Telegram status is fetched again", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    let linkStatus = () => Promise.reject<Response>(new TypeError("Failed to fetch"));
    api.override = ({ method, url }) =>
      method === "GET" && url.startsWith("/api/telegram/link?") ? linkStatus() : undefined;
    const { rerender } = await renderCard();
    expect(summaryValue("Email")).toBe("saved@example.com");

    // AavePositions keys the card by market, so a chain switch remounts it, which fetches the failed status again.
    linkStatus = () => new Promise<Response>(() => undefined);
    rerender(<NotificationConfig key="another-chain" {...PROPS} />);
    await settle();
    expect(api.requests.filter(request => request.startsWith("GET /api/telegram/link?"))).toHaveLength(2);
    expect(summaryValue("Email")).toBe("saved@example.com");
  });

  it("keeps waiting for Telegram when a chain switch remounts the card, and announces the link once", async () => {
    const { rerender } = await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    await click(button("Connect Telegram"));
    expect(popup.location.href).toBe(DEEP_LINK);

    // AavePositions keys the card by market, so a chain switch remounts it with a fresh form.
    rerender(<NotificationConfig key="another-chain" {...PROPS} chainId={10} chainName="Optimism" />);
    await settle();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    expect(button("Waiting for Telegram")).toBeDefined();
    expect(screen.getByRole("link", { name: /Open Telegram/ }).getAttribute("href")).toBe(DEEP_LINK);

    api.links[ADDRESS.toLowerCase()] = { linked: true, chatId: "777", username: "bob", linkedAt: "now" };
    await settle(2000);
    expect(screen.getByText("Connected as @bob")).toBeDefined();
    expect(mocks.toasts).toEqual(["success: Telegram connected as @bob"]);
    expect(openSpy).toHaveBeenCalledTimes(1);
  });

  it("ends a Telegram handshake when the wallet switches, so it does not resume when switching back", async () => {
    const { rerender } = await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    await click(button("Connect Telegram"));

    mocks.address = OTHER_ADDRESS;
    rerender(<NotificationConfig {...PROPS} />);
    await settle();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    expect(button("Connect Telegram")).toBeDefined();
    expect(screen.queryByRole("link", { name: /Open Telegram/ })).toBeNull();

    mocks.address = ADDRESS;
    rerender(<NotificationConfig {...PROPS} />);
    await settle();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    expect(button("Connect Telegram")).toBeDefined();
    const polls = () => api.requests.filter(request => request.startsWith("GET /api/telegram/link?")).length;
    const before = polls();
    api.links[ADDRESS.toLowerCase()] = { linked: true, chatId: "777", username: "bob", linkedAt: "now" };
    await settle(20_000);
    expect(polls()).toBe(before);
    expect(mocks.toasts).toEqual([]);
  });

  describe("when the page takes the card away", () => {
    // app/aave/page.tsx renders no card without a connected wallet, and AavePositions none while positions load (a
    // refresh, a wallet switch) or after they all failed to, so the card can unmount without a successor.
    const Page = ({ shown }: { shown: boolean }) => (shown ? <NotificationConfig {...PROPS} /> : null);
    const LINKED = { linked: true, chatId: "777", username: "bob", linkedAt: "now" } as const;
    const telegramPolls = () => api.requests.filter(request => request.startsWith("GET /api/telegram/link?")).length;

    const openTelegramField = async () => {
      await click(button("Create alert"));
      await click(serviceToggle("Telegram"));
    };

    const renderPage = async () => {
      const view = renderWithProviders(<Page shown />);
      await settle();
      await openTelegramField();
      await click(button("Connect Telegram"));
      return view;
    };

    it.each([
      ["disconnects", undefined],
      ["switches to a wallet whose positions fail to load", OTHER_ADDRESS],
    ])(
      "ends a Telegram handshake when the wallet %s, so it does not resume when the wallet returns",
      async (_, next) => {
        const { rerender } = await renderPage();
        mocks.address = next;
        rerender(<Page shown={false} />);
        await settle(30_000);

        mocks.address = ADDRESS;
        rerender(<Page shown />);
        await settle();
        await openTelegramField();
        expect(button("Connect Telegram")).toBeDefined();
        expect(screen.queryByRole("link", { name: /Open Telegram/ })).toBeNull();
        const before = telegramPolls();
        api.links[ADDRESS.toLowerCase()] = LINKED;
        await settle(20_000);
        expect(telegramPolls()).toBe(before);
        expect(mocks.toasts).toEqual([]);
      },
    );

    it("does not report a timeout for a Telegram handshake that a disconnect ended", async () => {
      const { rerender } = await renderPage();
      await settle(9 * 60 * 1000);
      mocks.address = undefined;
      rerender(<Page shown={false} />);
      await settle(2 * 60 * 1000);

      mocks.address = ADDRESS;
      rerender(<Page shown />);
      await settle();
      expect(mocks.toasts).toEqual([]);
    });

    it("keeps waiting for Telegram when a positions refresh unmounts the card for a moment", async () => {
      const { rerender } = await renderPage();
      rerender(<Page shown={false} />);
      await settle();
      rerender(<Page shown />);
      await settle();
      await openTelegramField();
      expect(button("Waiting for Telegram")).toBeDefined();
      expect(screen.getByRole("link", { name: /Open Telegram/ }).getAttribute("href")).toBe(DEEP_LINK);

      api.links[ADDRESS.toLowerCase()] = LINKED;
      await settle(2000);
      expect(screen.getByText("Connected as @bob")).toBeDefined();
      expect(mocks.toasts).toEqual(["success: Telegram connected as @bob"]);
    });
  });

  it("stops polling on Cancel and on unmount", async () => {
    const { unmount } = await renderCard();
    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    await click(button("Connect Telegram"));
    await settle(2000);
    await click(button("Cancel"));
    const polls = () => api.requests.filter(request => request.startsWith("GET /api/telegram/link")).length;
    const afterCancel = polls();
    await settle(20_000);
    expect(polls()).toBe(afterCancel);

    await click(button("Create alert"));
    await click(serviceToggle("Telegram"));
    await click(button("Connect Telegram"));
    const beforeUnmount = polls();
    unmount();
    await settle(20_000);
    expect(polls()).toBe(beforeUnmount);
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
      `POST /api/attribution ${JSON.stringify({ userId: ADDRESS, answer: "A friend in a Telegram group" })}`,
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
      method === "GET" && url === `/api/notifications/config?userId=${OTHER_ADDRESS}`
        ? new Promise<Response>(resolve => (releaseOther = () => resolve(jsonResponse({}))))
        : undefined;
    const { rerender } = await renderCard();
    await click(button("Edit alert"));
    expect(emailInput().value).toBe("saved@example.com");

    mocks.address = OTHER_ADDRESS;
    rerender(<NotificationConfig {...PROPS} />);
    await settle();
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
    expect(lastPutBody()).toMatchObject({ userId: ADDRESS, chainId: 1, market: LIDO_SPOKE, email: "lido@example.com" });
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
    expect(lastRequest("DELETE")).toBe(
      `DELETE /api/notifications/config {"userId":"${ADDRESS}","chainId":1,"market":"${LIDO_SPOKE}"}`,
    );
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
    expect(lastRequest("DELETE")).toBe(
      `DELETE /api/notifications/config {"userId":"${ADDRESS}","chainId":1,"market":"v3"}`,
    );
    expect(markets()).toBe("false true");
    expect(api.configs[ADDRESS.toLowerCase()]).toEqual({ [`1:${LIDO_SPOKE}`]: lidoAlert });
  });
});

describe("NotificationConfig: accessibility", () => {
  it("labels and describes every control and hides decorative icons", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: SAVED_CONFIG };
    api.links[ADDRESS.toLowerCase()] = SAVED_LINK;
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
    expect(within(screen.getByRole("group", { name: "Telegram" })).getByRole("button").textContent).toBe(
      "Disconnect Telegram",
    );
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
  // The solid pink fill: the Button default variant (btn-primary) or a bg-primary surface.
  const isPink = (element: Element) =>
    (element.getAttribute("class") ?? "").split(/\s+/).some(token => token === "btn-primary" || token === "bg-primary");

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
    api.links[ADDRESS.toLowerCase()] = SAVED_LINK;
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
    await click(button("Disconnect Telegram"));
    await click(button("Connect Telegram"));
    scan("connecting", container);
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
      connecting: 1,
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
    scan("read-only", readOnly.container);
    readOnly.unmount();

    api.override = ({ method, url }) =>
      method === "GET" && url.startsWith("/api/notifications/config") ? jsonResponse({}, 500) : undefined;
    const failed = await renderCard();
    scan("load error", failed.container);
    failed.unmount();

    mocks.hasAccess = true;
    api.override = ({ method, url }) =>
      method === "GET" && url.startsWith("/api/telegram/link?") ? jsonResponse({}, 500) : undefined;
    const unknownLink = await renderCard();
    await click(button("Edit alert"));
    expect(screen.getByText("Couldn't check your Telegram link")).toBeDefined();
    scan("unknown link", unknownLink.container);
    expect(problems).toEqual([]);
    expect(pinkCounts).toEqual({ "read-only": 0, "load error": 0, "unknown link": 1 });
  });
});

describe("NotificationConfig: language", () => {
  const DASHES = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
  /** The language of each config the card handed to the API client. */
  const savedLocales = (upsert: { mock: { calls: [string, NotificationConfigType][] } }) =>
    upsert.mock.calls.map(([, config]) => config.locale);
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
    expect(upsert.mock.calls[0][1]).toMatchObject({ healthFactorThreshold: 1.8, locale: "cs" });
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
    api.configs[ADDRESS.toLowerCase()] = { [MARKET_KEY]: { ...SAVED_CONFIG, services: ["telegram"] } };
    api.override = ({ method, url }) =>
      method === "GET" && url.startsWith("/api/telegram/link?") ? jsonResponse({}, 500) : undefined;
    const unknownLink = await renderCard({}, "cs");
    await click(button("Upravit upozornění"));
    expect(screen.getByText("Propojení s Telegramem se nepodařilo ověřit")).toBeDefined();
    await click(button("Uložit upozornění"));
    expect(fieldErrors()).toEqual([
      "Propojení s Telegramem se nepodařilo ověřit",
      "Ověřte propojení s Telegramem tlačítkem Zkusit znovu a potom uložte.",
    ]);
    texts.push(unknownLink.container.textContent ?? "");
    api.override = () => undefined;
    await click(button("Zkusit znovu"));
    await click(button("Připojit Telegram"));
    expect(screen.getByText(/^Otevře našeho bota v Telegramu/).textContent).toBe(
      "Otevře našeho bota v Telegramu. Stiskněte tam Start a tato peněženka se propojí s vaším chatem.",
    );
    expect(screen.getByRole("link", { name: "Otevřít Telegram (otevře se v nové kartě)" })).toBeDefined();
    api.links[ADDRESS.toLowerCase()] = SAVED_LINK;
    await settle(2000);
    expect(mocks.toasts).toEqual(["success: Telegram připojen jako @saved_tg"]);
    expect(screen.getByText("Připojeno jako @saved_tg")).toBeDefined();
    texts.push(unknownLink.container.textContent ?? "");
    // The bot's farewell in the chat follows the page's language.
    await click(button("Odpojit Telegram"));
    expect(lastRequest("DELETE /api/telegram/link")).toBe(
      `DELETE /api/telegram/link {"userId":"${ADDRESS}","locale":"cs"}`,
    );
    expect(mocks.toasts.at(-1)).toBe("success: Telegram odpojen");
    unknownLink.unmount();

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
      expect(text).not.toMatch(/\b(?:Save|Delete|Cancel|Connect|Alert|Threshold)\b/);
    }
  });
});
