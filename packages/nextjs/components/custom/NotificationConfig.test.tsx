// @vitest-environment jsdom
import { notifyManager } from "@tanstack/react-query";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationConfig } from "~~/components/custom/NotificationConfig";
import { useNotificationConfig } from "~~/hooks/custom/useNotificationConfig";
import type { TelegramLinkStatus } from "~~/types/notifications";
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
  configs: {} as Record<string, Record<number, unknown>>,
  links: {} as Record<string, TelegramLinkStatus>,
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
    if (method === "PUT") {
      const { enabled, services, healthFactorThreshold, email, signalRecipient } = body ?? {};
      const config = { chainId, enabled, services, healthFactorThreshold };
      api.configs[user] = {
        ...api.configs[user],
        [chainId]: { ...config, ...(email ? { email } : {}), ...(signalRecipient ? { signalRecipient } : {}) },
      };
    }
    if (method === "DELETE") delete api.configs[user]?.[chainId];
    return jsonResponse({ success: true });
  }
  if (path === "/api/telegram/link") {
    if (method === "GET") return jsonResponse(api.links[userOf(url)] ?? { linked: false });
    delete api.links[user];
    return jsonResponse({ success: true });
  }
  if (path === "/api/telegram/link-token") return linkTokenResponse();
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

const PROPS = { chainId: CHAIN_ID, chainName: "Arbitrum", currentHealthFactor: "1.20" };

const renderCard = async (props: Partial<typeof PROPS> = {}) => {
  const view = renderWithProviders(<NotificationConfig {...PROPS} {...props} />);
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

const button = (name: string | RegExp) => screen.getByRole("button", { name });
const serviceToggle = (name: "Email" | "Signal" | "Telegram") =>
  screen.getByRole("button", { name: { Email: "📧Email", Signal: "🔒Signal", Telegram: "✈️Telegram" }[name] });
const emailInput = () => screen.getByPlaceholderText<HTMLInputElement>("you@example.com");
const signalInput = () => screen.getByPlaceholderText<HTMLInputElement>("@alice.42");
const slider = () => screen.getByRole<HTMLInputElement>("slider");
const thresholdInput = () =>
  screen.getByRole<HTMLInputElement>("textbox", { name: "Health factor threshold (manual)" });
/** The value next to a summary label such as "Telegram:". */
const summaryValue = (label: string) => screen.queryByText(label)?.nextElementSibling?.textContent ?? null;
const lastRequest = (prefix: string) => api.requests.filter(request => request.startsWith(prefix)).at(-1);

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
  api.requests = [];
  api.override = () => undefined;
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"], now: NOW });
  vi.stubGlobal("fetch", fetchMock);
  popup = { opener: window, location: { href: "" }, close: vi.fn() };
  openSpy = vi.spyOn(window, "open").mockImplementation(() => popup as unknown as Window);
  consoleErrors = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => void consoleErrors.push(args));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
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
    api.configs[ADDRESS.toLowerCase()] = { [CHAIN_ID]: SAVED_CONFIG };
    api.links[ADDRESS.toLowerCase()] = SAVED_LINK;
    const { rerender } = await renderCard();
    expect(screen.getByText("Pay for access to edit")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    expect(screen.getByText("Active")).toBeDefined();
    expect(summaryValue("Email:")).toBe("saved@example.com");
    expect(summaryValue("Signal:")).toBe("@saved.01");
    expect(summaryValue("Telegram:")).toBe("@saved_tg");
    expect(summaryValue("Threshold:")).toBe("1.8");
    expect(screen.getByText("⚠️ Current Health Factor (1.20) is below your threshold!")).toBeDefined();

    rerender(<NotificationConfig {...PROPS} currentHealthFactor="∞" />);
    expect(screen.queryByText(/is below your threshold/)).toBeNull();
  });

  it("hides the Active badge and warning for a disabled config and drops unknown services", async () => {
    mocks.hasAccess = false;
    api.configs[ADDRESS.toLowerCase()] = {
      [CHAIN_ID]: { ...SAVED_CONFIG, enabled: false, services: ["email", "sms"], healthFactorThreshold: 25 },
    };
    await renderCard({ currentHealthFactor: "1.00" });
    expect(screen.queryByText("Active")).toBeNull();
    expect(screen.queryByText(/is below your threshold/)).toBeNull();
    expect(summaryValue("Services:")).toBe("📧 Email");
    expect(summaryValue("Threshold:")).toBe("10");
  });

  it("shows a load error with Retry instead of the Create state when the configs cannot be loaded", async () => {
    api.override = ({ method, url }) =>
      method === "GET" && url.startsWith("/api/notifications/config")
        ? jsonResponse({ error: "Database error" }, 500)
        : undefined;
    await renderCard();
    expect(screen.queryByRole("button", { name: "Create notification config" })).toBeNull();
    // Only the message is announced, so the Retry label changing does not repeat it.
    expect(screen.getByRole("alert").textContent).toBe("Could not load your notification settings.");
    expect(button("Retry")).toBeDefined();

    api.override = () => undefined;
    api.configs[ADDRESS.toLowerCase()] = { [CHAIN_ID]: SAVED_CONFIG };
    await click(button("Retry"));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(summaryValue("Email:")).toBe("saved@example.com");
  });

  it("keeps the load error on screen while a retry is in flight", async () => {
    let answer: () => Response | Promise<Response> = () => jsonResponse({ error: "Database error" }, 500);
    api.override = ({ method, url }) =>
      method === "GET" && url.startsWith("/api/notifications/config") ? answer() : undefined;
    await renderCard();
    answer = () => new Promise<Response>(() => undefined);
    await click(button("Retry"));
    expect(screen.getByRole("alert")).toBeDefined();
    expect((button("Retrying...") as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("NotificationConfig: creating and editing", () => {
  it("validates in field order, then saves the normalized form, accepting the 'u:' Signal form", async () => {
    await renderCard();
    await click(button("Create notification config"));
    await click(button("Save"));
    expect(mocks.toasts).toEqual([]);
    expect((button("Save") as HTMLButtonElement).disabled).toBe(true);

    await click(serviceToggle("Email"));
    await type(emailInput(), "  not-an-email ");
    await click(button("Save"));
    await type(emailInput(), " me@example.com ");
    await click(serviceToggle("Signal"));
    await type(signalInput(), "@");
    await click(button("Save"));
    await type(signalInput(), " @alice ");
    await click(button("Save"));
    await type(signalInput(), " u:alice.42 ");
    await type(thresholdInput(), "2,5");
    fireEvent.blur(thresholdInput());
    await click(button("Save"));
    expect(mocks.toasts).toEqual([
      "error: Please enter a valid email address",
      "error: Please enter your Signal username",
      "error: Invalid Signal username. Expected format: alice.42 (find yours in Signal → Settings → Profile)",
      "success: Notification configuration saved.",
    ]);
    expect(lastRequest("PUT")).toBe(
      `PUT /api/notifications/config {"userId":"${ADDRESS}","chainId":${CHAIN_ID},"enabled":true,"services":["email","signal"],"healthFactorThreshold":2.5,"email":"me@example.com","signalRecipient":"alice.42"}`,
    );
    expect(summaryValue("Email:")).toBe("me@example.com");
    expect(summaryValue("Signal:")).toBe("@alice.42");
    expect(summaryValue("Threshold:")).toBe("2.5");
  });

  it("opens Telegram inside the Connect click and offers the bot link until the chat is linked", async () => {
    await renderCard();
    await click(button("Create notification config"));
    await click(serviceToggle("Telegram"));
    expect((button("Save") as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(button("Connect Telegram"));
    expect(openSpy.mock.calls).toEqual([["", "_blank"]]);
    await settle();
    expect(popup.location.href).toBe(DEEP_LINK);
    expect(button("Waiting for Telegram… (open the bot and press Start)")).toBeDefined();
    const openLink = screen.getByRole("link", { name: "Open Telegram" });
    expect([openLink.getAttribute("href"), openLink.getAttribute("target"), openLink.getAttribute("rel")]).toEqual([
      DEEP_LINK,
      "_blank",
      "noopener noreferrer",
    ]);

    api.links[ADDRESS.toLowerCase()] = { linked: true, chatId: "777", username: "bob", linkedAt: "now" };
    await settle(2000);
    expect(screen.getByText("✅ Connected as @bob")).toBeDefined();
    expect(screen.queryByRole("link", { name: "Open Telegram" })).toBeNull();
    expect((button("Save") as HTMLButtonElement).disabled).toBe(false);
    expect(mocks.toasts).toEqual(["success: Telegram connected as @bob"]);
  });

  it("keeps a Telegram link made while editing after Save", async () => {
    await renderCard();
    await click(button("Create notification config"));
    await click(serviceToggle("Telegram"));
    await click(button("Connect Telegram"));
    api.links[ADDRESS.toLowerCase()] = { linked: true, chatId: "777", username: "bob", linkedAt: "now" };
    await settle(2000);
    await click(button("Save"));
    expect(lastRequest("PUT")).toContain('"services":["telegram"]');

    // B0.0: the link is read from the link API, so saving a config cannot drop it.
    expect(summaryValue("Telegram:")).toBe("@bob");
    await click(button("Edit"));
    expect(screen.getByText("✅ Connected as @bob")).toBeDefined();
    expect((button("Save") as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows a wallet's existing Telegram link when creating a config on another chain", async () => {
    api.links[ADDRESS.toLowerCase()] = SAVED_LINK;
    await renderCard();
    await click(button("Create notification config"));
    await click(serviceToggle("Telegram"));
    expect(screen.getByText("✅ Connected as @saved_tg")).toBeDefined();
    await click(button("Save"));
    expect(lastRequest("PUT")).toContain('"services":["telegram"]');
    expect(mocks.toasts).toEqual(["success: Notification configuration saved."]);
    expect(summaryValue("Telegram:")).toBe("@saved_tg");
  });

  it("falls back to the Email service for an enabled config without valid services, also after Cancel", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [CHAIN_ID]: { ...SAVED_CONFIG, services: [], healthFactorThreshold: 0 } };
    await renderCard();
    expect(summaryValue("Services:")).toBe("📧 Email");
    expect(summaryValue("Threshold:")).toBe("1.5");
    await click(button("Edit"));
    expect(emailInput().value).toBe("saved@example.com");
    await click(button("Cancel"));
    expect(summaryValue("Services:")).toBe("📧 Email");
  });

  it("edits the threshold through the text input and the slider", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [CHAIN_ID]: SAVED_CONFIG };
    await renderCard({ currentHealthFactor: "1.75" });
    await click(button("Edit"));
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
    expect(screen.getByText(/be notified when your Health Factor drops below/).textContent).toBe(
      "You'll be notified when your Health Factor drops below 10 on Arbitrum.",
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
    api.configs[ADDRESS.toLowerCase()] = { [CHAIN_ID]: SAVED_CONFIG };
    await renderCard();
    await click(button("Edit"));
    await click(serviceToggle("Signal"));
    await type(emailInput(), "changed@example.com");
    await click(button("Cancel"));
    expect(summaryValue("Email:")).toBe("saved@example.com");
    expect(summaryValue("Signal:")).toBe("@saved.01");

    await click(button("Edit"));
    await click(button("Delete"));
    expect(lastRequest("DELETE")).toBe(
      `DELETE /api/notifications/config {"userId":"${ADDRESS}","chainId":${CHAIN_ID}}`,
    );
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(screen.queryByPlaceholderText("you@example.com")).toBeNull();
    expect(mocks.toasts).toEqual([]);
    await click(button("Cancel"));
    expect(button("Create notification config")).toBeDefined();
  });

  it("requires a connected wallet for Telegram and for saving", async () => {
    mocks.address = undefined;
    await renderCard();
    await click(button("Create notification config"));
    await click(serviceToggle("Telegram"));
    await click(button("Connect Telegram"));
    expect(openSpy).not.toHaveBeenCalled();
    await click(serviceToggle("Telegram"));
    await click(serviceToggle("Email"));
    await type(emailInput(), "me@example.com");
    await click(button("Save"));
    expect(mocks.toasts).toEqual(["error: Connect your wallet first", "error: Wallet not connected"]);
    expect(api.requests).toEqual([]);
  });
});

describe("NotificationConfig: failures", () => {
  it("reports save and delete failures with the server's message", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [CHAIN_ID]: { ...SAVED_CONFIG, services: ["email", "signal"] } };
    let put = () => jsonResponse({ error: "Active paid access required to update notification config" }, 403);
    let del = () => jsonResponse({ error: "Active paid access required to delete notification config" }, 403);
    api.override = ({ method, url }) => {
      if (method === "PUT") return put();
      if (method === "DELETE" && url === "/api/notifications/config") return del();
      return undefined;
    };
    await renderCard();
    await click(button("Edit"));

    await click(button("Save"));
    put = () => new Response("<html>oops</html>", { status: 500 });
    await click(button("Save"));
    await click(button("Delete"));
    del = () => new Response("not json", { status: 500 });
    await click(button("Delete"));
    expect(mocks.toasts).toEqual([
      "error: Active paid access required to update notification config",
      "error: Failed to save notification config",
      "error: Active paid access required to delete notification config",
      "error: Failed to delete notification config",
    ]);
    expect(button("Delete")).toBeDefined();
    expect(emailInput().value).toBe("saved@example.com");
  });

  it("disables Save and Delete while their request is in flight", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [CHAIN_ID]: { ...SAVED_CONFIG, services: ["email"] } };
    const put = deferred<Response>();
    const del = deferred<void>();
    api.override = call => {
      if (call.method === "PUT") return put.promise;
      if (call.method === "DELETE" && call.url === "/api/notifications/config")
        return del.promise.then(() => route(call));
      return undefined;
    };
    await renderCard();
    await click(button("Edit"));

    await click(button("Save"));
    expect((button("Saving...") as HTMLButtonElement).disabled).toBe(true);
    put.resolve(jsonResponse({ error: "Database error" }, 502));
    await settle();
    expect((button("Save") as HTMLButtonElement).disabled).toBe(false);

    await click(button("Delete"));
    expect((button("Deleting...") as HTMLButtonElement).disabled).toBe(true);
    del.resolve();
    await settle();
    expect(screen.queryByRole("button", { name: /^Delet/ })).toBeNull();
    expect(mocks.toasts).toEqual(["error: Database error"]);
  });

  it("reports Telegram connect and disconnect failures", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [CHAIN_ID]: SAVED_CONFIG };
    api.links[ADDRESS.toLowerCase()] = SAVED_LINK;
    api.override = ({ method, url }) => {
      if (method === "DELETE" && url === "/api/telegram/link") return jsonResponse({ error: "Database error" }, 500);
      if (method === "POST") return jsonResponse({ error: "Telegram is not configured on this server" }, 503);
      return undefined;
    };
    await renderCard();
    await click(button("Edit"));
    await click(button("Disconnect"));
    expect(screen.getByText("✅ Connected as @saved_tg")).toBeDefined();

    api.links = {};
    api.override = ({ method }) =>
      method === "POST" ? jsonResponse({ error: "Telegram is not configured on this server" }, 503) : undefined;
    await click(button("Disconnect"));
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
    api.configs[ADDRESS.toLowerCase()] = { [CHAIN_ID]: SAVED_CONFIG };
    api.links[ADDRESS.toLowerCase()] = SAVED_LINK;
    await renderCard();
    await click(button("Edit"));
    await click(button("Disconnect"));
    expect(button("Connect Telegram")).toBeDefined();
    await click(button("Cancel"));
    expect(summaryValue("Telegram:")).toBeNull();
    await click(button("Edit"));
    expect(button("Connect Telegram")).toBeDefined();
  });

  it("waits until the link token expires before giving up", async () => {
    await renderCard();
    await click(button("Create notification config"));
    await click(serviceToggle("Telegram"));
    await click(button("Connect Telegram"));
    await settle(5 * 60 * 1000);
    expect(button("Waiting for Telegram… (open the bot and press Start)")).toBeDefined();
    await settle(5 * 60 * 1000);
    expect(button("Connect Telegram")).toBeDefined();
    expect(mocks.toasts).toEqual(["error: Telegram link timed out. Try again."]);
  });

  it("keeps waiting for the token's full lifetime when the device clock runs ahead of the server", async () => {
    // By this device's clock the token (valid until NOW + 10 min by the server's clock) expired 5 minutes ago.
    vi.setSystemTime(NOW + 15 * 60 * 1000);
    await renderCard();
    await click(button("Create notification config"));
    await click(serviceToggle("Telegram"));
    await click(button("Connect Telegram"));
    await settle(5 * 60 * 1000);
    expect(button("Waiting for Telegram… (open the bot and press Start)")).toBeDefined();
    expect(mocks.toasts).toEqual([]);

    api.links[ADDRESS.toLowerCase()] = { linked: true, chatId: "777", username: "bob", linkedAt: "now" };
    await settle(2000);
    expect(screen.getByText("✅ Connected as @bob")).toBeDefined();
    expect(mocks.toasts).toEqual(["success: Telegram connected as @bob"]);
  });

  it("offers Retry instead of Connect when the Telegram link cannot be checked, keeping the card on screen", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [CHAIN_ID]: SAVED_CONFIG };
    api.links[ADDRESS.toLowerCase()] = SAVED_LINK;
    let linkStatus: (call: Call) => Response | Promise<Response> = () =>
      jsonResponse({ error: "Failed to read the Telegram link" }, 500);
    api.override = call =>
      call.method === "GET" && call.url.startsWith("/api/telegram/link?") ? linkStatus(call) : undefined;
    await renderCard();
    expect(summaryValue("Email:")).toBe("saved@example.com");
    await click(button("Edit"));

    const field = within(screen.getByRole("group", { name: "Telegram" }));
    expect(field.getByRole("alert").textContent).toBe("Couldn't check your Telegram link.");
    expect(field.queryByRole("button", { name: "Connect Telegram" })).toBeNull();
    expect((button("Save") as HTMLButtonElement).disabled).toBe(true);

    const retry = deferred<void>();
    linkStatus = call => retry.promise.then(() => route(call));
    await click(field.getByRole("button", { name: "Retry" }));
    expect((field.getByRole("button", { name: "Retrying..." }) as HTMLButtonElement).disabled).toBe(true);
    expect(field.getByRole("alert")).toBeDefined();

    retry.resolve();
    await settle();
    expect(field.queryByRole("alert")).toBeNull();
    expect(screen.getByText("✅ Connected as @saved_tg")).toBeDefined();
    expect((button("Save") as HTMLButtonElement).disabled).toBe(false);
    expect(mocks.toasts).toEqual([]);
  });

  it("offers Connect after a successful Retry for a wallet without a link", async () => {
    let linkStatus: (call: Call) => Response | Promise<Response> = () =>
      jsonResponse({ error: "Failed to read the Telegram link" }, 500);
    api.override = call =>
      call.method === "GET" && call.url.startsWith("/api/telegram/link?") ? linkStatus(call) : undefined;
    await renderCard();
    await click(button("Create notification config"));
    await click(serviceToggle("Telegram"));
    expect(screen.queryByRole("button", { name: "Connect Telegram" })).toBeNull();

    linkStatus = route;
    await click(button("Retry"));
    expect(button("Connect Telegram")).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps the card on screen while a failed Telegram status is fetched again", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [CHAIN_ID]: SAVED_CONFIG };
    let linkStatus = () => Promise.reject<Response>(new TypeError("Failed to fetch"));
    api.override = ({ method, url }) =>
      method === "GET" && url.startsWith("/api/telegram/link?") ? linkStatus() : undefined;
    const { rerender } = await renderCard();
    expect(summaryValue("Email:")).toBe("saved@example.com");

    // AavePositions keys the card by chain, so a chain switch remounts it, which fetches the failed status again.
    linkStatus = () => new Promise<Response>(() => undefined);
    rerender(<NotificationConfig key="another-chain" {...PROPS} />);
    await settle();
    expect(api.requests.filter(request => request.startsWith("GET /api/telegram/link?"))).toHaveLength(2);
    expect(summaryValue("Email:")).toBe("saved@example.com");
  });

  it("keeps waiting for Telegram when a chain switch remounts the card, and announces the link once", async () => {
    const { rerender } = await renderCard();
    await click(button("Create notification config"));
    await click(serviceToggle("Telegram"));
    await click(button("Connect Telegram"));
    expect(popup.location.href).toBe(DEEP_LINK);

    // AavePositions keys the card by chain, so a chain switch remounts it with a fresh form.
    rerender(<NotificationConfig key="another-chain" {...PROPS} chainId={10} chainName="Optimism" />);
    await settle();
    await click(button("Create notification config"));
    await click(serviceToggle("Telegram"));
    expect(button("Waiting for Telegram… (open the bot and press Start)")).toBeDefined();
    expect(screen.getByRole("link", { name: "Open Telegram" }).getAttribute("href")).toBe(DEEP_LINK);

    api.links[ADDRESS.toLowerCase()] = { linked: true, chatId: "777", username: "bob", linkedAt: "now" };
    await settle(2000);
    expect(screen.getByText("✅ Connected as @bob")).toBeDefined();
    expect((button("Save") as HTMLButtonElement).disabled).toBe(false);
    expect(mocks.toasts).toEqual(["success: Telegram connected as @bob"]);
    expect(openSpy).toHaveBeenCalledTimes(1);
  });

  it("ends a Telegram handshake when the wallet switches, so it does not resume when switching back", async () => {
    const { rerender } = await renderCard();
    await click(button("Create notification config"));
    await click(serviceToggle("Telegram"));
    await click(button("Connect Telegram"));

    mocks.address = OTHER_ADDRESS;
    rerender(<NotificationConfig {...PROPS} />);
    await settle();
    await click(button("Create notification config"));
    await click(serviceToggle("Telegram"));
    expect(button("Connect Telegram")).toBeDefined();
    expect(screen.queryByRole("link", { name: "Open Telegram" })).toBeNull();

    mocks.address = ADDRESS;
    rerender(<NotificationConfig {...PROPS} />);
    await settle();
    await click(button("Create notification config"));
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
      await click(button("Create notification config"));
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
        expect(screen.queryByRole("link", { name: "Open Telegram" })).toBeNull();
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
      expect(button("Waiting for Telegram… (open the bot and press Start)")).toBeDefined();
      expect(screen.getByRole("link", { name: "Open Telegram" }).getAttribute("href")).toBe(DEEP_LINK);

      api.links[ADDRESS.toLowerCase()] = LINKED;
      await settle(2000);
      expect(screen.getByText("✅ Connected as @bob")).toBeDefined();
      expect(mocks.toasts).toEqual(["success: Telegram connected as @bob"]);
    });
  });

  it("stops polling on Cancel and on unmount", async () => {
    const { unmount } = await renderCard();
    await click(button("Create notification config"));
    await click(serviceToggle("Telegram"));
    await click(button("Connect Telegram"));
    await settle(2000);
    await click(button("Cancel"));
    const polls = () => api.requests.filter(request => request.startsWith("GET /api/telegram/link")).length;
    const afterCancel = polls();
    await settle(20_000);
    expect(polls()).toBe(afterCancel);

    await click(button("Create notification config"));
    await click(serviceToggle("Telegram"));
    await click(button("Connect Telegram"));
    const beforeUnmount = polls();
    unmount();
    await settle(20_000);
    expect(polls()).toBe(beforeUnmount);
  });
});

describe("NotificationConfig: shared state", () => {
  const HasConfigProbe = () => {
    const { hasConfig, isLoaded } = useNotificationConfig();
    return <p data-testid="probe">{isLoaded ? String(hasConfig(CHAIN_ID)) : "loading"}</p>;
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
    await click(button("Create notification config"));
    await click(serviceToggle("Email"));
    await type(emailInput(), "me@example.com");
    await click(button("Save"));
    expect(screen.getByTestId("probe").textContent).toBe("true");
    await click(button("Edit"));
    await click(button("Delete"));
    expect(screen.getByTestId("probe").textContent).toBe("false");
    // Through the shared cache: the configs were loaded once and never reloaded.
    expect(api.requests.filter(request => request.startsWith("GET /api/notifications/config"))).toHaveLength(1);
  });

  it("does not show or reuse the previous wallet's settings after a wallet switch", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [CHAIN_ID]: SAVED_CONFIG };
    let releaseOther: () => void = () => undefined;
    api.override = ({ method, url }) =>
      method === "GET" && url === `/api/notifications/config?userId=${OTHER_ADDRESS}`
        ? new Promise<Response>(resolve => (releaseOther = () => resolve(jsonResponse({}))))
        : undefined;
    const { rerender } = await renderCard();
    await click(button("Edit"));
    expect(emailInput().value).toBe("saved@example.com");

    mocks.address = OTHER_ADDRESS;
    rerender(<NotificationConfig {...PROPS} />);
    await settle();
    expect(screen.queryByText("Notification Settings")).toBeNull();

    releaseOther();
    await settle();
    await click(button("Create notification config"));
    expect(screen.queryByPlaceholderText("you@example.com")).toBeNull();
    expect(serviceToggle("Email").getAttribute("aria-pressed")).toBe("false");
    expect(thresholdInput().value).toBe("1.50");
  });
});

describe("NotificationConfig: accessibility", () => {
  it("labels every control and hides decorative icons", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [CHAIN_ID]: SAVED_CONFIG };
    api.links[ADDRESS.toLowerCase()] = SAVED_LINK;
    const { container } = await renderCard();
    await click(button("Edit"));

    const services = screen.getByRole("group", { name: "Notification Services" });
    const toggles = within(services).getAllByRole("button");
    expect(toggles.map(toggle => [toggle.textContent, toggle.getAttribute("aria-pressed")])).toEqual([
      ["📧Email", "true"],
      ["🔒Signal", "true"],
      ["✈️Telegram", "true"],
    ]);
    await click(toggles[1]);
    expect(toggles[1].getAttribute("aria-pressed")).toBe("false");

    expect(screen.getByLabelText("Email address")).toBe(emailInput());
    await click(toggles[1]);
    expect(screen.getByLabelText("Signal username")).toBe(signalInput());
    // A static name; the value is the value text, so the two cannot contradict each other.
    expect(screen.getByRole("slider", { name: "Health Factor Threshold:" })).toBe(slider());
    expect(slider().getAttribute("aria-valuetext")).toBe("1.8");
    expect(within(screen.getByRole("group", { name: "Telegram" })).getByRole("button").textContent).toBe("Disconnect");
    expect(container.querySelectorAll("label:not([for])")).toHaveLength(0);

    const icons = [...container.querySelectorAll("svg")];
    expect(icons.length).toBeGreaterThan(0);
    expect(icons.every(icon => icon.getAttribute("aria-hidden") === "true")).toBe(true);
  });
});

describe("NotificationConfig: light theme", () => {
  // Shades that only read well on a dark background must come with a light-theme shade (`text-x-700 dark:text-x-400`).
  const DARK_ONLY_SHADE = /^(?:text-(?:amber|red|emerald|purple|sky)-(?:300|400)|bg-gray-(?:700|800|900))$/;
  // Each light shade added for the light theme, with the shade the card used before: dark mode must keep it.
  const ORIGINAL_DARK_SHADE: Record<string, string> = {
    "text-amber-700": "dark:text-amber-400",
    "text-emerald-700": "dark:text-emerald-400",
    "text-sky-700": "dark:text-sky-300",
    "text-purple-700": "dark:text-purple-300",
    "text-purple-600": "dark:text-purple-400",
    "text-red-600": "dark:text-red-400",
    "bg-base-300": "dark:bg-gray-700",
  };

  /** Collects theme problems across the card states it is shown, and which light shades it saw. */
  const themeScanner = () => {
    const problems: string[] = [];
    const seen = new Set<string>();
    const scan = (root: HTMLElement) => {
      for (const element of [root, ...root.querySelectorAll("[class]")]) {
        const tokens = (element.getAttribute("class") ?? "").split(/\s+/);
        for (const token of tokens) {
          const dark = ORIGINAL_DARK_SHADE[token];
          if (DARK_ONLY_SHADE.test(token)) problems.push(`${token} without a light shade`);
          else if (dark && !tokens.includes(dark)) problems.push(`${token} without ${dark}`);
          else if (dark) seen.add(token);
        }
      }
    };
    return { problems, seen, scan };
  };

  it("pairs every shade in every state of the card, keeping the original dark shades", async () => {
    api.configs[ADDRESS.toLowerCase()] = { [CHAIN_ID]: SAVED_CONFIG };
    api.links[ADDRESS.toLowerCase()] = SAVED_LINK;
    const { problems, seen, scan } = themeScanner();
    const { container } = await renderCard();
    scan(container);
    await click(button("Edit"));
    scan(container);
    await click(serviceToggle("Email"));
    await click(serviceToggle("Signal"));
    await click(serviceToggle("Telegram"));
    scan(container);
    await click(serviceToggle("Telegram"));
    await click(button("Disconnect"));
    await click(button("Connect Telegram"));
    scan(container);
    await click(button("Delete"));
    await click(button("Cancel"));
    scan(container);
    expect(problems).toEqual([]);
    expect([...seen].sort()).toEqual(Object.keys(ORIGINAL_DARK_SHADE).sort());
  });

  it("pairs every shade in the read-only and error states", async () => {
    mocks.hasAccess = false;
    api.configs[ADDRESS.toLowerCase()] = { [CHAIN_ID]: SAVED_CONFIG };
    const { problems, scan } = themeScanner();
    const readOnly = await renderCard();
    scan(readOnly.container);
    readOnly.unmount();

    api.override = ({ method, url }) =>
      method === "GET" && url.startsWith("/api/notifications/config") ? jsonResponse({}, 500) : undefined;
    const failed = await renderCard();
    scan(failed.container);
    failed.unmount();

    mocks.hasAccess = true;
    api.override = ({ method, url }) =>
      method === "GET" && url.startsWith("/api/telegram/link?") ? jsonResponse({}, 500) : undefined;
    const unknownLink = await renderCard();
    await click(button("Edit"));
    expect(screen.getByText("Couldn't check your Telegram link.")).toBeDefined();
    scan(unknownLink.container);
    expect(problems).toEqual([]);
  });
});
