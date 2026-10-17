// @vitest-environment jsdom
import { notifyManager } from "@tanstack/react-query";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { TelegramUsernameField } from "~~/components/custom/notifications/TelegramUsernameField";
import { LocaleProvider } from "~~/i18n/LocaleProvider";
import type { Locale } from "~~/i18n/locales";
import { jsonResponse } from "~~/utils/testing/helpers";
import { renderWithProviders } from "~~/utils/testing/providers";

/*
 * The Telegram username input and its link status line against the real hook, with the status API behind a mocked
 * `fetch`. Timers are fake so the typing pause, the retry and the polling can be stepped through.
 */

const NOW = Date.parse("2026-10-14T12:00:00.000Z");
const BOT = "tokenping_bot";

const api = {
  /** The usernames that have pressed Start in the bot. */
  linked: new Set<string>(),
  /** Answers a status request instead (failures, slow responses). */
  override: (() => undefined) as (url: string) => Response | Promise<Response> | undefined,
  requests: [] as string[],
};

const fetchMock = vi.fn(async (url: string) => {
  api.requests.push(url);
  const answer = await api.override(url);
  if (answer) return answer;
  const username = new URL(url, "http://test").searchParams.get("username") ?? "";
  return jsonResponse({ linked: api.linked.has(username) });
});

type Props = Partial<Parameters<typeof TelegramUsernameField>[0]>;

/** Advances the fake clock and lets requests and re-renders settle. */
const settle = async (ms = 0) => {
  await act(() => vi.advanceTimersByTimeAsync(ms));
  await act(() => vi.advanceTimersByTimeAsync(0));
};

const renderField = async ({ value = "", onChange = () => undefined, ...props }: Props = {}, locale: Locale = "en") => {
  const view = renderWithProviders(
    <LocaleProvider locale={locale}>
      <TelegramUsernameField id="form-telegram" value={value} onChange={onChange} {...props} />
    </LocaleProvider>,
  );
  await settle();
  return view;
};

const input = () => screen.getByRole<HTMLInputElement>("textbox");
/** The polite status line under the input. */
const statusLine = () => screen.getByRole("status");
const DASHES = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);

beforeAll(() => notifyManager.setScheduler(queueMicrotask));
afterAll(() => notifyManager.setScheduler(callback => setTimeout(callback, 0)));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"], now: NOW });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", BOT);
  api.linked = new Set();
  api.override = () => undefined;
  api.requests = [];
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("TelegramUsernameField: the input", () => {
  it("is a required text input named by its label and described by where to find the username", async () => {
    const { container } = await renderField();
    expect(screen.getByLabelText("Telegram username")).toBe(input());
    expect(input().required).toBe(true);
    expect(document.getElementById(input().getAttribute("aria-describedby") ?? "")?.textContent).toBe(
      "Alerts go to this Telegram account. Find it in Telegram under Settings, then Username.",
    );
    expect(input().placeholder).toBe("alice_eth");
    // A username, not a word: no autofill, capitals, autocorrect or spell check.
    expect(
      ["autocomplete", "autocapitalize", "autocorrect", "spellcheck"].map(name => input().getAttribute(name)),
    ).toEqual(["off", "off", "off", "false"]);
    // The error summary links to the field by its id, and the form finds its input by data-field.
    const field = container.querySelector("#form-telegram");
    expect(field?.getAttribute("data-field")).toBe("telegram");
    expect(field?.contains(input())).toBe(true);
  });

  it("shows what it is given and hands every change up as typed", async () => {
    const onChange = vi.fn();
    await renderField({ value: "@Alice", onChange });
    expect(input().value).toBe("@Alice");
    fireEvent.change(input(), { target: { value: "@Alice_Eth" } });
    expect(onChange.mock.calls).toEqual([["@Alice_Eth"]]);
  });

  it("shows an error under the input as an alert and marks the input invalid", async () => {
    await renderField({ error: "Enter your Telegram username." });
    expect(screen.getByRole("alert").textContent).toBe("Enter your Telegram username.");
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(
      (input().getAttribute("aria-describedby") ?? "").split(" ").map(id => document.getElementById(id)?.textContent),
    ).toEqual([
      "Alerts go to this Telegram account. Find it in Telegram under Settings, then Username.",
      "Enter your Telegram username.",
    ]);
  });
});

describe("TelegramUsernameField: the link status", () => {
  it("keeps an empty polite live region while there is no valid username, and asks nothing", async () => {
    const { rerender } = await renderField();
    expect(statusLine().getAttribute("aria-live")).toBe("polite");
    expect(statusLine().textContent).toBe("");
    rerender(
      <LocaleProvider locale="en">
        <TelegramUsernameField id="form-telegram" value="rom" onChange={() => undefined} />
      </LocaleProvider>,
    );
    await settle(5000);
    expect(statusLine().textContent).toBe("");
    expect(api.requests).toEqual([]);
  });

  it("says Checking while the first answer is on its way", async () => {
    api.override = () => new Promise<Response>(() => undefined);
    await renderField({ value: "alice_eth" });
    expect(statusLine().textContent).toBe("Checking");
    expect(statusLine().querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("asks about the normalized username and says when it is linked", async () => {
    api.linked.add("alice_eth");
    await renderField({ value: " @Alice_Eth " });
    expect(api.requests).toEqual(["/api/telegram/status?username=alice_eth"]);
    expect(statusLine().textContent).toBe("@alice_eth is linked: alerts will arrive in your Telegram chat.");
    expect(within(statusLine()).queryByRole("link")).toBeNull();
  });

  it("asks a username that is not linked yet to press Start once, with a link to the bot", async () => {
    await renderField({ value: "alice_eth" });
    expect(statusLine().textContent).toBe(
      `Not linked yet: press Start in @${BOT} once.Open @${BOT} (opens in a new tab)`,
    );
    // The space before "(opens in a new tab)" sits outside the sr-only span, so the accessible name keeps it.
    const link = within(statusLine()).getByRole("link", { name: `Open @${BOT} (opens in a new tab)` });
    expect(link.querySelector(".sr-only")?.textContent).toBe("(opens in a new tab)");
    expect([link.getAttribute("href"), link.getAttribute("target"), link.getAttribute("rel")]).toEqual([
      `https://t.me/${BOT}`,
      "_blank",
      "noopener noreferrer",
    ]);
  });

  it("links to the bot without the '@' the bot setting may carry", async () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", `@${BOT}`);
    await renderField({ value: "alice_eth" });
    expect(screen.getByRole("link").getAttribute("href")).toBe(`https://t.me/${BOT}`);
    expect(statusLine().textContent).toContain(`press Start in @${BOT} once.`);
  });

  it("turns to linked by itself once the account presses Start in the bot", async () => {
    await renderField({ value: "alice_eth" });
    expect(statusLine().textContent).toMatch(/^Not linked yet/);
    api.linked.add("alice_eth");
    await settle(3000);
    expect(statusLine().textContent).toBe("@alice_eth is linked: alerts will arrive in your Telegram chat.");
  });

  it("says the status could not be checked, and that saving still works, when the request fails", async () => {
    api.override = () => jsonResponse({ error: "Database error" }, 500);
    await renderField({ value: "alice_eth" });
    // The one retry is still on its way.
    expect(statusLine().textContent).toBe("Checking");
    await settle(1000);
    expect(statusLine().textContent).toBe("Couldn't check whether this username is linked. You can still save.");
    expect(within(statusLine()).queryByRole("link")).toBeNull();
  });

  it("names the bot generically and links nowhere for a username that is not linked while no bot is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
    await renderField({ value: "alice_eth" });
    expect(statusLine().textContent).toBe("Not linked yet: press Start in the Tokenping bot once.");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("checks a newly typed username once typing pauses", async () => {
    api.linked.add("other_name");
    const { rerender } = await renderField({ value: "alice_eth" });
    rerender(
      <LocaleProvider locale="en">
        <TelegramUsernameField id="form-telegram" value="other_name" onChange={() => undefined} />
      </LocaleProvider>,
    );
    await settle();
    expect(statusLine().textContent).toBe("Checking");
    await settle(400);
    expect(statusLine().textContent).toBe("@other_name is linked: alerts will arrive in your Telegram chat.");
    expect(api.requests).toEqual([
      "/api/telegram/status?username=alice_eth",
      "/api/telegram/status?username=other_name",
    ]);
  });

  it("hides every icon from assistive technology and uses no dashes", async () => {
    const { container } = await renderField({ value: "alice_eth" });
    const icons = [...container.querySelectorAll("svg")];
    expect(icons.length).toBeGreaterThan(0);
    expect(icons.every(icon => icon.getAttribute("aria-hidden") === "true")).toBe(true);
    expect(container.textContent).not.toMatch(DASHES);
  });
});

describe("TelegramUsernameField in Czech", () => {
  const text = (element: HTMLElement) => {
    const content = element.textContent ?? "";
    expect(content).not.toMatch(DASHES);
    return content;
  };

  it("labels, describes and shows an example in Czech", async () => {
    await renderField({ error: "Zadejte své uživatelské jméno na Telegramu." }, "cs");
    expect(screen.getByLabelText("Uživatelské jméno na Telegramu")).toBe(input());
    expect(
      (input().getAttribute("aria-describedby") ?? "").split(" ").map(id => document.getElementById(id)?.textContent),
    ).toEqual([
      "Upozornění půjdou na tento účet na Telegramu. Uživatelské jméno najdete v Telegramu v Nastavení, v části Uživatelské jméno.",
      "Zadejte své uživatelské jméno na Telegramu.",
    ]);
    expect(input().placeholder).toBe("alice_eth");
  });

  it("writes every status in Czech", async () => {
    api.override = () => new Promise<Response>(() => undefined);
    const checking = await renderField({ value: "alice_eth" }, "cs");
    expect(text(statusLine())).toBe("Ověřujeme");
    checking.unmount();

    api.override = () => undefined;
    api.linked.add("alice_eth");
    const linked = await renderField({ value: "alice_eth" }, "cs");
    expect(text(statusLine())).toBe("Propojeno: @alice_eth. Upozornění budou chodit do vašeho chatu na Telegramu.");
    linked.unmount();

    const notLinked = await renderField({ value: "jiny_ucet" }, "cs");
    expect(text(statusLine())).toBe(
      `Zatím nepropojeno: jednou stiskněte Start v @${BOT}.Otevřít @${BOT} (otevře se v nové kartě)`,
    );
    expect(screen.getByRole("link", { name: `Otevřít @${BOT} (otevře se v nové kartě)` })).toBeTruthy();
    notLinked.unmount();

    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
    const noBot = await renderField({ value: "jiny_ucet" }, "cs");
    expect(text(statusLine())).toBe("Zatím nepropojeno: jednou stiskněte Start v botovi Tokenpingu.");
    expect(screen.queryByRole("link")).toBeNull();
    noBot.unmount();
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", BOT);

    api.override = () => jsonResponse({ error: "Database error" }, 500);
    await renderField({ value: "alice_eth" }, "cs");
    await settle(1000);
    expect(text(statusLine())).toBe("Nepodařilo se ověřit, jestli je toto jméno propojené. Uložit můžete i tak.");
  });
});
