import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationConfig } from "~~/components/custom/NotificationConfig";
import { deferred, jsonResponse } from "~~/utils/testing/helpers";
import { ComponentHarness, blur, changeValue, click, keyDown } from "~~/utils/testing/hookHarness";

/*
 * Golden master for the notification settings card. Each scenario drives the real component, the
 * useNotificationConfig / Telegram hooks and the API clients against a mocked `fetch`, and records a transcript of
 * outbound requests, toasts, window.open calls and the rendered markup. The snapshots were recorded from the
 * pre-refactor component; markup, request payloads and toast order must not change in a structure-only refactor.
 * Steps whose recorded output is knowingly wrong carry a BUG(<id>) comment (ids from the bug list); a fix updates
 * the snapshot for those steps only.
 */

const mocks = vi.hoisted(() => ({
  address: undefined as string | undefined,
  hasAccess: true,
  log: [] as string[],
  respond: (() => undefined) as (call: { method: string; url: string }) => Response | Promise<Response> | undefined,
}));

vi.mock("react", async importOriginal =>
  (await import("~~/utils/testing/hookHarness")).withFakeHooks(await importOriginal()),
);
vi.mock("wagmi", () => ({ useAccount: () => ({ address: mocks.address }) }));
vi.mock("~~/hooks/custom/useAccess", () => ({ useAccess: () => ({ isActive: mocks.hasAccess }) }));
vi.mock("~~/utils/scaffold-eth", () => ({
  notification: {
    success: (message: string) => mocks.log.push(`toast.success: ${message}`),
    error: (message: string) => mocks.log.push(`toast.error: ${message}`),
  },
}));

const ADDRESS = "0xAbCdEf0000000000000000000000000000000001";
const OTHER_ADDRESS = "0x1234500000000000000000000000000000000002";
const CHAIN_ID = 42161;
const CONFIG_URL = `/api/notifications/config?userId=${ADDRESS}`;
const LINK_URL = `/api/telegram/link?userId=${ADDRESS}`;

const SAVED_CONFIG = {
  chainId: CHAIN_ID,
  enabled: true,
  services: ["email", "signal", "telegram"],
  healthFactorThreshold: 1.8,
  email: "saved@example.com",
  signalRecipient: "saved.01",
  telegramChatId: "555",
  telegramUsername: "saved_tg",
};

const LINK_TOKEN = { token: "tok", botUsername: "bot", expiresAt: "later", deepLink: "https://t.me/bot?start=tok" };

/** Default API: no saved configs, Telegram not linked, every write succeeds. */
const defaultResponse = ({ method, url }: { method: string; url: string }) => {
  if (method === "GET" && url.startsWith("/api/notifications/config")) return jsonResponse({});
  if (method === "GET" && url.startsWith("/api/telegram/link")) return jsonResponse({ linked: false });
  if (method === "POST" && url === "/api/telegram/link-token") return jsonResponse(LINK_TOKEN);
  return jsonResponse({ success: true });
};

const withConfigs = (configs: Record<number, unknown>) => (call: { method: string; url: string }) =>
  call.method === "GET" && call.url === CONFIG_URL ? jsonResponse(configs) : undefined;

const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
  const { body, ...options } = init ?? {};
  const method = init?.method ?? "GET";
  mocks.log.push(
    `fetch: ${method} ${url}${Object.keys(options).length ? ` ${JSON.stringify(options)}` : ""}${body ? ` body=${body}` : ""}`,
  );
  return (await mocks.respond({ method, url })) ?? defaultResponse({ method, url });
});

const formatHtml = (html: string) => (html === "" ? ["(empty)"] : html.split(/(?<=>)(?=<)/));

/** Collapses runs of identical lines (Telegram polling) so the transcript stays readable. */
const collapse = (lines: string[]) =>
  lines.reduce<string[]>((out, line) => {
    const last = out.at(-1);
    const match = last?.match(/^(.*) \(x(\d+)\)$/);
    if (match && match[1] === line) out[out.length - 1] = `${line} (x${Number(match[2]) + 1})`;
    else if (last === line) out[out.length - 1] = `${line} (x2)`;
    else out.push(line);
    return out;
  }, []);

const PROPS = { chainId: CHAIN_ID, chainName: "Arbitrum", currentHealthFactor: "1.20" };

const mount = async (props: Partial<typeof PROPS> = {}) => {
  const view = new ComponentHarness(NotificationConfig, { ...PROPS, ...props });
  view.flush();
  snap(view, "first render");
  await view.act();
  return view;
};

const snap = (view: ComponentHarness<typeof PROPS>, label: string) => {
  mocks.log.push(`--- ${label} ---`, ...formatHtml(view.html()));
};

const transcript = () => collapse(mocks.log);

const button = (view: ComponentHarness<typeof PROPS>, text: string) => view.get("button", text);
const emailInput = (view: ComponentHarness<typeof PROPS>) => view.get("input", { type: "email" });
const signalInput = (view: ComponentHarness<typeof PROPS>) => view.get("input", { placeholder: "@alice.42" });
const slider = (view: ComponentHarness<typeof PROPS>) => view.get("input", { type: "range" });
const thresholdInput = (view: ComponentHarness<typeof PROPS>) =>
  view.get("input", { "aria-label": "Health factor threshold (manual)" });

beforeEach(() => {
  mocks.address = ADDRESS;
  mocks.hasAccess = true;
  mocks.log = [];
  mocks.respond = () => undefined;
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("window", {
    open: (...args: unknown[]) => mocks.log.push(`window.open: ${args.join(" ")}`),
  });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("NotificationConfig (golden master)", () => {
  it("renders nothing while loading, and nothing without access and without a config", async () => {
    mocks.hasAccess = false;
    const view = await mount();
    snap(view, "loaded, no access, no config");
    expect(transcript()).toMatchSnapshot();
  });

  it("shows a read-only summary with the below-threshold warning when access lapsed", async () => {
    mocks.hasAccess = false;
    mocks.respond = withConfigs({ [CHAIN_ID]: SAVED_CONFIG });
    const view = await mount({ currentHealthFactor: "1.20" });
    snap(view, "read-only summary, HF below threshold");
    view.setProps({ currentHealthFactor: "∞" });
    snap(view, "read-only summary, infinite HF");
    expect(transcript()).toMatchSnapshot();
  });

  it("hides the Active badge and warning for a disabled config and drops unknown services", async () => {
    mocks.hasAccess = false;
    mocks.respond = withConfigs({
      [CHAIN_ID]: { ...SAVED_CONFIG, enabled: false, services: ["email", "sms"], healthFactorThreshold: 25 },
    });
    const view = await mount({ currentHealthFactor: "1.00" });
    snap(view, "read-only summary, disabled config");
    expect(transcript()).toMatchSnapshot();
  });

  it("falls back to the Email service for an enabled config without valid services, also after Cancel", async () => {
    mocks.respond = withConfigs({ [CHAIN_ID]: { ...SAVED_CONFIG, services: [], healthFactorThreshold: 0 } });
    const view = await mount();
    snap(view, "summary of legacy config");
    await view.act(() => click(button(view, "Edit")));
    snap(view, "editing legacy config");
    await view.act(() => click(button(view, "Cancel")));
    snap(view, "after cancel");
    expect(transcript()).toMatchSnapshot();
  });

  it("creates a config with email, Signal and Telegram, including the Telegram handshake", async () => {
    const linkToken = deferred<Response>();
    let linkStatus: () => Response | Promise<Response> = () => jsonResponse({ linked: false });
    mocks.respond = ({ method, url }) => {
      if (method === "POST" && url === "/api/telegram/link-token") return linkToken.promise;
      if (method === "GET" && url === LINK_URL) return linkStatus();
      return undefined;
    };
    const view = await mount();
    snap(view, "empty state");

    await view.act(() => click(button(view, "Create notification config")));
    snap(view, "empty form");
    await view.act(() => click(button(view, "Save")));

    await view.act(() => click(button(view, "📧Email")));
    snap(view, "email selected");
    await view.act(() => changeValue(emailInput(view), "  not-an-email "));
    await view.act(() => click(button(view, "Save")));
    await view.act(() => changeValue(emailInput(view), " me@example.com "));

    await view.act(() => click(button(view, "🔒Signal")));
    await view.act(() => changeValue(signalInput(view), "@"));
    await view.act(() => click(button(view, "Save")));
    await view.act(() => changeValue(signalInput(view), " @alice "));
    await view.act(() => click(button(view, "Save")));
    await view.act(() => changeValue(signalInput(view), " @alice.42 "));
    snap(view, "email and signal filled");

    await view.act(() => click(button(view, "✈️Telegram")));
    snap(view, "telegram selected, not linked");

    await view.act(() => {
      void click(button(view, "Connect Telegram"));
    });
    snap(view, "waiting for link token");
    await view.act(() => linkToken.resolve(jsonResponse(LINK_TOKEN)));
    snap(view, "polling");

    await vi.advanceTimersByTimeAsync(2000);
    await view.act();
    linkStatus = () => Promise.reject(new TypeError("Failed to fetch"));
    await vi.advanceTimersByTimeAsync(2000);
    await view.act();
    linkStatus = () => jsonResponse({ linked: true, chatId: "777", username: "bob", linkedAt: "now" });
    await vi.advanceTimersByTimeAsync(2000);
    await view.act();
    snap(view, "telegram linked");
    await vi.advanceTimersByTimeAsync(10_000);
    await view.act();
    mocks.log.push("(10s later: no further polling expected above)");

    await view.act(() => changeValue(thresholdInput(view), "2,5"));
    await view.act(() => blur(thresholdInput(view)));
    snap(view, "threshold 2.5");

    // BUG(B0.0): Save does not keep the Telegram link made in this session. "after save" has no Telegram row, and
    // "editing again after save" shows "Connect Telegram" with Save disabled.
    await view.act(() => click(button(view, "Save")));
    snap(view, "after save");
    await view.act(() => click(button(view, "Edit")));
    snap(view, "editing again after save");
    expect(transcript()).toMatchSnapshot();
  });

  it("edits threshold input and slider, cancels, deletes and cancels back to the empty state", async () => {
    mocks.respond = withConfigs({ [CHAIN_ID]: SAVED_CONFIG });
    const view = await mount({ currentHealthFactor: "1.75" });
    snap(view, "summary");
    await view.act(() => click(button(view, "Edit")));
    snap(view, "editing saved config");

    const typed = async (value: string) => {
      await view.act(() => changeValue(thresholdInput(view), value));
      mocks.log.push(
        `typed ${JSON.stringify(value)} -> text ${JSON.stringify(thresholdInput(view).props.value)}, slider ${String(slider(view).props.value)}`,
      );
    };
    await typed("abc");
    await typed("12.345");
    await typed("3.");
    await view.act(() => blur(thresholdInput(view)));
    mocks.log.push(`blur -> text ${JSON.stringify(thresholdInput(view).props.value)}`);
    await typed("");
    await view.act(() => blur(thresholdInput(view)));
    mocks.log.push(`blur -> text ${JSON.stringify(thresholdInput(view).props.value)}`);
    await typed("0.5");
    await typed("99");
    await view.act(() => blur(thresholdInput(view)));
    mocks.log.push(`blur -> text ${JSON.stringify(thresholdInput(view).props.value)}`);
    snap(view, "threshold 99 typed (slider clamps to 3)");
    await typed("2.25");
    mocks.log.push(
      `keydown e/E/+/-/1 prevented: ${["e", "E", "+", "-", "1"].map(key => keyDown(thresholdInput(view), key)).join(",")}`,
    );

    const slid = async (value: string) => {
      await view.act(() => changeValue(slider(view), value));
      mocks.log.push(
        `slider ${value} -> text ${JSON.stringify(thresholdInput(view).props.value)}, slider ${String(slider(view).props.value)}`,
      );
    };
    await slid("2.7");
    vi.stubGlobal("document", { activeElement: null });
    await slid("2.4");
    vi.stubGlobal("document", { activeElement: {} });
    await slid("2.6");
    await slid("5");
    snap(view, "after slider changes");

    await view.act(() => click(button(view, "🔒Signal")));
    await view.act(() => changeValue(emailInput(view), "changed@example.com"));
    await view.act(() => click(button(view, "Cancel")));
    snap(view, "after cancel");

    await view.act(() => click(button(view, "Edit")));
    await view.act(() => click(button(view, "Delete")));
    snap(view, "after delete");
    await view.act(() => click(button(view, "Cancel")));
    snap(view, "cancel without config");
    expect(transcript()).toMatchSnapshot();
  });

  it("reports save, delete and Telegram failures", async () => {
    let put: () => Response = () =>
      jsonResponse({ error: "Active paid access required to update notification config" }, 403);
    let del: () => Response = () => jsonResponse({ error: ["first", "second"] }, 502);
    let linkToken: () => Response = () => jsonResponse({ error: "Telegram is not configured on this server" }, 503);
    let unlink: () => Response = () => jsonResponse({ error: "Database error" }, 500);
    mocks.respond = ({ method, url }) => {
      if (method === "GET" && url === CONFIG_URL) return jsonResponse({ [CHAIN_ID]: SAVED_CONFIG });
      if (method === "PUT") return put();
      if (method === "DELETE" && url === "/api/notifications/config") return del();
      if (method === "POST") return linkToken();
      if (method === "DELETE" && url === "/api/telegram/link") return unlink();
      return undefined;
    };
    const view = await mount();
    await view.act(() => click(button(view, "Edit")));

    await view.act(() => click(button(view, "Save")));
    put = () => new Response("<html>oops</html>", { status: 500 });
    await view.act(() => click(button(view, "Save")));
    put = () => jsonResponse({ error: ["array message"] }, 400);
    await view.act(() => click(button(view, "Save")));
    snap(view, "still editing after failed saves");

    // BUG(B0.10): failed deletes are only logged; the transcript shows no toast for them.
    await view.act(() => click(button(view, "Delete")));
    del = () => new Response("not json", { status: 500 });
    await view.act(() => click(button(view, "Delete")));
    snap(view, "still editing after failed deletes (no toast)");

    await view.act(() => click(button(view, "Disconnect")));
    unlink = () => jsonResponse({ success: true });
    await view.act(() => click(button(view, "Disconnect")));
    snap(view, "telegram disconnected");
    await view.act(() => click(button(view, "Connect Telegram")));
    linkToken = () => new Response("bad gateway", { status: 502 });
    await view.act(() => click(button(view, "Connect Telegram")));
    snap(view, "after failed connects");
    expect(transcript()).toMatchSnapshot();
  });

  it("restores the disconnected Telegram link on Cancel", async () => {
    mocks.respond = withConfigs({ [CHAIN_ID]: SAVED_CONFIG });
    const view = await mount();
    await view.act(() => click(button(view, "Edit")));
    await view.act(() => click(button(view, "Disconnect")));
    snap(view, "telegram disconnected while editing");
    // BUG(B0.2): Cancel restores the link from the saved config, which still has the chat id the server just deleted.
    await view.act(() => click(button(view, "Cancel")));
    snap(view, "after cancel, telegram shown again");
    await view.act(() => click(button(view, "Edit")));
    snap(view, "editing again, telegram connected again");
    expect(transcript()).toMatchSnapshot();
  });

  it("times out the Telegram handshake after two minutes", async () => {
    const view = await mount();
    await view.act(() => click(button(view, "Create notification config")));
    await view.act(() => click(button(view, "✈️Telegram")));
    await view.act(() => click(button(view, "Connect Telegram")));
    await vi.advanceTimersByTimeAsync(120_000);
    await view.act();
    snap(view, "still polling at 120s");
    await vi.advanceTimersByTimeAsync(2000);
    await view.act();
    snap(view, "timed out");
    await vi.advanceTimersByTimeAsync(10_000);
    await view.act();
    expect(transcript()).toMatchSnapshot();
  });

  it("stops polling on Cancel and on unmount", async () => {
    const view = await mount();
    await view.act(() => click(button(view, "Create notification config")));
    await view.act(() => click(button(view, "✈️Telegram")));
    await view.act(() => click(button(view, "Connect Telegram")));
    await vi.advanceTimersByTimeAsync(2000);
    await view.act();
    await view.act(() => click(button(view, "Cancel")));
    snap(view, "cancelled while polling");
    await vi.advanceTimersByTimeAsync(10_000);
    await view.act();
    mocks.log.push("(no polling after cancel expected above)");

    await view.act(() => click(button(view, "Create notification config")));
    await view.act(() => click(button(view, "✈️Telegram")));
    await view.act(() => click(button(view, "Connect Telegram")));
    view.unmount();
    await vi.advanceTimersByTimeAsync(10_000);
    mocks.log.push("(unmounted: no polling expected above)");
    expect(transcript()).toMatchSnapshot();
  });

  it("requires a connected wallet for Telegram and for saving", async () => {
    mocks.address = undefined;
    const view = await mount();
    snap(view, "no wallet, empty state");
    await view.act(() => click(button(view, "Create notification config")));
    await view.act(() => click(button(view, "✈️Telegram")));
    await view.act(() => click(button(view, "Connect Telegram")));
    await view.act(() => click(button(view, "✈️Telegram")));
    await view.act(() => click(button(view, "📧Email")));
    await view.act(() => changeValue(emailInput(view), "me@example.com"));
    await view.act(() => click(button(view, "Save")));
    snap(view, "after save without wallet");
    expect(transcript()).toMatchSnapshot();
  });

  it("treats load failures as no configs", async () => {
    mocks.respond = ({ method, url }) =>
      method === "GET" && url === CONFIG_URL ? jsonResponse({ error: "Database error" }, 500) : undefined;
    const failedResponse = await mount();
    snap(failedResponse, "HTTP 500 on load");
    failedResponse.unmount();

    mocks.respond = ({ method, url }) =>
      method === "GET" && url === CONFIG_URL ? Promise.reject(new TypeError("Failed to fetch")) : undefined;
    const networkError = await mount();
    snap(networkError, "network error on load");
    expect(transcript()).toMatchSnapshot();
  });

  it("keeps form state when the chain changes and shows the previous wallet's configs until the new ones load", async () => {
    const otherConfigs = deferred<Response>();
    mocks.respond = ({ method, url }) => {
      if (method === "GET" && url === CONFIG_URL) return jsonResponse({ [CHAIN_ID]: SAVED_CONFIG });
      if (method === "GET" && url === `/api/notifications/config?userId=${OTHER_ADDRESS}`) return otherConfigs.promise;
      return undefined;
    };
    const view = await mount();
    view.setProps({ chainId: 10, chainName: "Optimism" });
    snap(view, "switched to a chain without config");
    view.setProps({ chainId: CHAIN_ID, chainName: "Arbitrum" });
    await view.act(() => click(button(view, "Edit")));
    // BUG(B0.3): the same instance gets the new chainId, so the Arbitrum draft stays open under Optimism.
    view.setProps({ chainId: 10, chainName: "Optimism" });
    snap(view, "switched chain while editing");
    view.setProps({ chainId: CHAIN_ID, chainName: "Arbitrum" });
    await view.act(() => click(button(view, "Cancel")));

    // BUG(B0.4): isLoaded stays true on a wallet switch, so wallet A's config is shown until B's request resolves.
    mocks.address = OTHER_ADDRESS;
    await view.act();
    snap(view, "new wallet, previous wallet's config still shown");
    await view.act(() =>
      otherConfigs.resolve(
        jsonResponse({ [CHAIN_ID]: { ...SAVED_CONFIG, email: "other@example.com", services: ["email"] } }),
      ),
    );
    snap(view, "new wallet's config loaded");
    expect(transcript()).toMatchSnapshot();
  });
});
