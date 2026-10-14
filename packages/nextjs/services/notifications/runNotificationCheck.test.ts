import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getHealthFactorForWallet } from "~~/services/aave/getHealthFactor";
import { fakeSupabase } from "~~/services/api/server/testing/fakeSupabase";
import { sendEmail } from "~~/services/email/sendEmail";
import type { EnabledConfigRow } from "~~/services/notifications/configRepository";
import {
  buildAlertEmail,
  buildAlertText,
  getDeliverableChannels,
  runNotificationCheck,
} from "~~/services/notifications/runNotificationCheck";
import { sendSignalMessage } from "~~/services/signal/sendSignal";
import { sendTelegramMessage } from "~~/services/telegram/sendTelegram";

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  return { getSupabaseServerClient: () => fakeSupabase.client };
});
vi.mock("~~/services/aave/getHealthFactor", () => ({ getHealthFactorForWallet: vi.fn() }));
vi.mock("~~/services/email/sendEmail", () => ({ sendEmail: vi.fn() }));
vi.mock("~~/services/signal/sendSignal", () => ({ sendSignalMessage: vi.fn() }));
vi.mock("~~/services/telegram/sendTelegram", () => ({ sendTelegramMessage: vi.fn() }));

const NOW = new Date("2026-10-14T09:05:07.000Z");
const NOW_TEXT = "Oct 14, 2026, 9:05:07 AM Coordinated Universal Time";
const LOWER = `0x${"3a".repeat(20)}`;
const CHECKSUMMED = `0x${"3A".repeat(20)}`;
const OTHER = `0x${"56".repeat(20)}`;

const CONFIGS_QUERY =
  'notification_configs.select("user_id, chain_id, health_factor_threshold, email, signal_recipient, services").eq("enabled",true)';
const LINKS_QUERY = 'user_telegram_links.select("user_id, chat_id")';
const deleteByChat = (chatId: string) => `user_telegram_links.delete().eq("chat_id","${chatId}")`;

type Row = Record<string, unknown>;
const configRow = (overrides: Row = {}): Row => ({
  user_id: LOWER,
  chain_id: 8453,
  health_factor_threshold: "1.5",
  email: "a@b.co",
  signal_recipient: "alice.42",
  services: ["email"],
  ...overrides,
});

const givenData = (rows: Row[], links: Row[] = []) =>
  fakeSupabase.respondByQuery({ [CONFIGS_QUERY]: { data: rows }, [LINKS_QUERY]: { data: links } });

const alertText = (chainName: string, healthFactor: string, threshold: string, timestamp = NOW_TEXT) =>
  `Your Aave Health Factor on ${chainName} is ${healthFactor}, which is below your threshold of ${threshold}. ` +
  `Consider adding collateral or repaying debt to avoid liquidation.\n\nSent at: ${timestamp}`;
const alertHtml = (chainName: string, healthFactor: string, threshold: string) =>
  `<p>Your Aave Health Factor on <strong>${chainName}</strong> is <strong>${healthFactor}</strong>, ` +
  `which is below your threshold of <strong>${threshold}</strong>.</p>` +
  `<p>Consider adding collateral or repaying debt to avoid liquidation.</p>` +
  `<p><small>Created at: ${NOW_TEXT}</small></p>`;

const summary = (overrides: Row = {}) => ({
  success: true,
  CRON_INTERVAL_MINUTES: 5,
  configsChecked: 0,
  emailsSent: 0,
  signalSent: 0,
  telegramSent: 0,
  ...overrides,
});

beforeEach(() => {
  fakeSupabase.reset();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.mocked(getHealthFactorForWallet).mockReset();
  vi.mocked(getHealthFactorForWallet).mockResolvedValue({ healthFactor: "1.20", chainName: "Base" });
  vi.mocked(sendEmail).mockReset();
  vi.mocked(sendEmail).mockResolvedValue({ success: true, id: "e1" });
  vi.mocked(sendSignalMessage).mockReset();
  vi.mocked(sendSignalMessage).mockResolvedValue({ success: true });
  vi.mocked(sendTelegramMessage).mockReset();
  vi.mocked(sendTelegramMessage).mockResolvedValue({ success: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("runNotificationCheck: loading", () => {
  it("fails with the Supabase message when the configs query errors, before loading links", async () => {
    fakeSupabase.respondByQuery({ [CONFIGS_QUERY]: { error: { message: "permission denied" } } });
    expect(await runNotificationCheck()).toEqual({ success: false, error: "permission denied" });
    expect(fakeSupabase.log()).toEqual([CONFIGS_QUERY]);
  });

  it("loads enabled configs and all Telegram links, omitting `errors` when there are none", async () => {
    givenData([]);
    const result = await runNotificationCheck();
    expect(JSON.stringify(result)).toBe(JSON.stringify(summary()));
    expect(fakeSupabase.log()).toEqual([CONFIGS_QUERY, LINKS_QUERY]);
  });

  it("treats null data as no rows and ignores a links query error", async () => {
    fakeSupabase.respondByQuery({
      [CONFIGS_QUERY]: { data: [configRow({ services: ["telegram"] })] },
      [LINKS_QUERY]: { error: { message: "links failed" } },
    });
    expect(await runNotificationCheck()).toEqual(summary());
  });

  it("checks only configs that have at least one deliverable channel", async () => {
    givenData(
      [
        configRow({ chain_id: 1, services: [] }),
        configRow({ chain_id: 2, services: null }),
        configRow({ chain_id: 3, services: ["email"], email: "   " }),
        configRow({ chain_id: 4, services: ["signal"], signal_recipient: null }),
        configRow({ chain_id: 5, services: ["telegram"], user_id: OTHER }),
        configRow({ chain_id: 6, services: ["sms"] }),
        configRow({ chain_id: 7, services: ["email"] }),
        configRow({ chain_id: 8, services: ["telegram"] }),
        configRow({ chain_id: 9, services: "email" }),
      ],
      [{ user_id: LOWER, chat_id: 555 }],
    );
    vi.mocked(getHealthFactorForWallet).mockResolvedValue({ healthFactor: "3.00", chainName: "Base" });

    expect(await runNotificationCheck()).toEqual(summary({ configsChecked: 2 }));
    expect(vi.mocked(getHealthFactorForWallet).mock.calls).toEqual([
      [LOWER, 7],
      [LOWER, 8],
    ]);
  });

  it("never matches Telegram links for a checksummed config user_id", async () => {
    // BUG(B3.13): links are stored lowercased but looked up with the raw config user_id.
    givenData([configRow({ user_id: CHECKSUMMED, services: ["telegram"] })], [{ user_id: LOWER, chat_id: "555" }]);
    expect(await runNotificationCheck()).toEqual(summary());
    expect(getHealthFactorForWallet).not.toHaveBeenCalled();
  });
});

describe("runNotificationCheck: health factor", () => {
  it.each([
    ["the read fails", null],
    ["it is infinite", { healthFactor: "∞", chainName: "Base" }],
    ["it is unparseable", { healthFactor: "n/a", chainName: "Base" }],
    ["it equals the threshold", { healthFactor: "1.50", chainName: "Base" }],
    ["it is above the threshold", { healthFactor: "1.51", chainName: "Base" }],
  ])("does not alert when %s", async (_label, healthFactor) => {
    givenData([configRow()]);
    vi.mocked(getHealthFactorForWallet).mockResolvedValue(healthFactor);
    expect(await runNotificationCheck()).toEqual(summary({ configsChecked: 1 }));
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it.each([
    // BUG(B3.12): a falsy threshold (0) silently becomes the 1.5 default.
    ["0", "1.49", "1.5"],
    [null, "1.49", "1.5"],
    ["abc", "1.49", "1.5"],
    ["2.0", "1.99", "2"],
    [3, "2.5", "3"],
    ["15", "12.00", "15"],
  ])("uses threshold %j (alerting at %s and printing %s)", async (stored, healthFactor, printed) => {
    givenData([configRow({ health_factor_threshold: stored })]);
    vi.mocked(getHealthFactorForWallet).mockResolvedValue({ healthFactor, chainName: "Base" });

    await runNotificationCheck();

    expect(vi.mocked(sendEmail).mock.calls[0][0].text).toBe(alertText("Base", healthFactor, printed));
  });
});

describe("runNotificationCheck: delivery", () => {
  it("alerts every channel in order with the exact copy", async () => {
    givenData(
      [configRow({ services: ["telegram", "signal", "email"], email: " a@b.co ", signal_recipient: " alice.42 " })],
      [{ user_id: LOWER, chat_id: 555 }],
    );

    const result = await runNotificationCheck();

    expect(JSON.stringify(result)).toBe(
      JSON.stringify(summary({ configsChecked: 1, emailsSent: 1, signalSent: 1, telegramSent: 1 })),
    );
    expect(getHealthFactorForWallet).toHaveBeenCalledExactlyOnceWith(LOWER, 8453);
    expect(sendEmail).toHaveBeenCalledExactlyOnceWith({
      to: "a@b.co",
      subject: "Aave Health Factor Alert – Base",
      text: alertText("Base", "1.20", "1.5"),
      html: alertHtml("Base", "1.20", "1.5"),
    });
    expect(sendSignalMessage).toHaveBeenCalledExactlyOnceWith({
      to: "alice.42",
      message: alertText("Base", "1.20", "1.5"),
    });
    expect(sendTelegramMessage).toHaveBeenCalledExactlyOnceWith({
      chatId: "555",
      message: alertText("Base", "1.20", "1.5"),
    });
    const order = [sendEmail, sendSignalMessage, sendTelegramMessage].map(
      fn => vi.mocked(fn).mock.invocationCallOrder[0],
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("formats the timestamp per alert", async () => {
    givenData([configRow({ chain_id: 1 }), configRow({ chain_id: 2 })]);
    vi.mocked(getHealthFactorForWallet)
      .mockResolvedValueOnce({ healthFactor: "1.20", chainName: "Ethereum" })
      .mockImplementationOnce(async () => {
        vi.setSystemTime(new Date("2026-12-31T23:59:59.000Z"));
        return { healthFactor: "1.10", chainName: "Polygon" };
      });

    await runNotificationCheck();

    expect(vi.mocked(sendEmail).mock.calls.map(([options]) => options.text)).toEqual([
      alertText("Ethereum", "1.20", "1.5"),
      alertText("Polygon", "1.10", "1.5", "Dec 31, 2026, 11:59:59 PM Coordinated Universal Time"),
    ]);
  });

  it("checks a Telegram-only config whose link has an empty chat id but sends nothing", async () => {
    // BUG(unlisted): the eligibility filter tests that a link exists, while sending needs a non-empty chat id.
    givenData([configRow({ services: ["telegram"] })], [{ user_id: LOWER, chat_id: "" }]);
    expect(await runNotificationCheck()).toEqual(summary({ configsChecked: 1 }));
    expect(getHealthFactorForWallet).toHaveBeenCalledExactlyOnceWith(LOWER, 8453);
    expect(sendTelegramMessage).not.toHaveBeenCalled();
  });

  it("only sends to the channels the config selected", async () => {
    givenData([configRow({ services: ["signal"] })], [{ user_id: LOWER, chat_id: "555" }]);
    expect(await runNotificationCheck()).toEqual(summary({ configsChecked: 1, signalSent: 1 }));
    expect(sendEmail).not.toHaveBeenCalled();
    expect(sendTelegramMessage).not.toHaveBeenCalled();
  });

  it("collects channel errors with the recipient in the message", async () => {
    givenData([configRow({ services: ["email", "signal", "telegram"] })], [{ user_id: LOWER, chat_id: "555" }]);
    vi.mocked(sendEmail).mockResolvedValue({ success: false, error: "Invalid email address" });
    vi.mocked(sendSignalMessage).mockResolvedValue({ success: false, error: "Signal API responded with 400: bad" });
    vi.mocked(sendTelegramMessage).mockResolvedValue({ success: false, error: "Forbidden", code: "api_error" });

    const result = await runNotificationCheck();

    expect(JSON.stringify(result)).toBe(
      JSON.stringify(
        summary({
          configsChecked: 1,
          errors: [
            "email:a@b.co: Invalid email address",
            "signal:alice.42: Signal API responded with 400: bad",
            "telegram:555: Forbidden",
          ],
        }),
      ),
    );
    expect(fakeSupabase.log()).toEqual([CONFIGS_QUERY, LINKS_QUERY]);
  });

  it.each(["bot_blocked", "chat_not_found"] as const)(
    "drops the Telegram link on %s and skips it for the user's remaining configs",
    async code => {
      givenData(
        [
          configRow({ chain_id: 1, services: ["telegram", "email"] }),
          configRow({ chain_id: 2, services: ["telegram", "email"] }),
        ],
        [{ user_id: LOWER, chat_id: "555" }],
      );
      vi.mocked(sendTelegramMessage).mockResolvedValue({ success: false, error: "blocked", code });

      const result = await runNotificationCheck();

      expect(result).toEqual(
        summary({ configsChecked: 2, emailsSent: 2, telegramSent: 0, errors: ["telegram:555: blocked"] }),
      );
      expect(sendTelegramMessage).toHaveBeenCalledOnce();
      expect(fakeSupabase.log()).toEqual([CONFIGS_QUERY, LINKS_QUERY, deleteByChat("555")]);
    },
  );

  it.each(["rate_limited", "network", "misconfigured", "api_error"] as const)("keeps the link on %s", async code => {
    givenData(
      [configRow({ chain_id: 1, services: ["telegram"] }), configRow({ chain_id: 2, services: ["telegram"] })],
      [{ user_id: LOWER, chat_id: "555" }],
    );
    vi.mocked(sendTelegramMessage).mockResolvedValue({ success: false, error: "x", code });

    const result = await runNotificationCheck();

    expect(result).toMatchObject({ errors: ["telegram:555: x", "telegram:555: x"] });
    expect(fakeSupabase.log()).toEqual([CONFIGS_QUERY, LINKS_QUERY]);
  });

  it("aborts the whole run with the message when anything throws", async () => {
    givenData([configRow({ chain_id: 1 }), configRow({ chain_id: 2 })]);
    vi.mocked(getHealthFactorForWallet).mockRejectedValueOnce(new Error("rpc exploded"));
    expect(await runNotificationCheck()).toEqual({ success: false, error: "rpc exploded" });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("reports 'Unknown error' for a non-Error throw", async () => {
    givenData([configRow()]);
    vi.mocked(sendEmail).mockRejectedValue("nope");
    expect(await runNotificationCheck()).toEqual({ success: false, error: "Unknown error" });
  });
});

describe("alert builders", () => {
  const alert = { chainName: "Arbitrum One", healthFactor: "1.07", threshold: 1.25, timestamp: NOW_TEXT };

  it("builds the text exactly as the inline template did", () => {
    expect(buildAlertText(alert)).toBe(alertText("Arbitrum One", "1.07", "1.25"));
  });

  it("builds the email subject (en dash) and html ('Created at' footer)", () => {
    expect(buildAlertEmail(alert)).toStrictEqual({
      subject: "Aave Health Factor Alert – Arbitrum One",
      html: alertHtml("Arbitrum One", "1.07", "1.25"),
    });
  });
});

describe("getDeliverableChannels", () => {
  const links = new Map([[LOWER, "555"]]);
  const asRow = (overrides: Row) => configRow(overrides) as EnabledConfigRow;

  it.each([
    [
      { services: ["telegram", "signal", "email"], email: " a@b.co ", signal_recipient: " alice.42 " },
      ["email", "signal", "telegram"],
    ],
    [{ services: ["email"], email: "  " }, []],
    [{ services: ["signal"], signal_recipient: null }, []],
    [{ services: ["telegram"], user_id: OTHER }, []],
    [{ services: ["telegram"], user_id: CHECKSUMMED }, []],
    [{ services: [] }, []],
    [{ services: null }, []],
    [{ services: "email" }, []],
    [{ services: ["sms"] }, []],
  ])("for %j returns channels %j", (overrides, channels) => {
    expect(getDeliverableChannels(asRow(overrides), links).map(({ channel }) => channel)).toEqual(channels);
  });

  it("keeps Telegram for a link with an empty chat id, with an empty recipient", () => {
    // BUG(unlisted): the config counts as deliverable, but runNotificationCheck never sends to an empty chat id.
    expect(getDeliverableChannels(asRow({ services: ["telegram"] }), new Map([[LOWER, ""]]))).toStrictEqual([
      { channel: "telegram", recipient: "" },
    ]);
  });

  it("returns trimmed recipients and the linked chat id", () => {
    expect(
      getDeliverableChannels(
        asRow({ services: ["email", "signal", "telegram"], email: " a@b.co ", signal_recipient: "\talice.42 " }),
        links,
      ),
    ).toStrictEqual([
      { channel: "email", recipient: "a@b.co" },
      { channel: "signal", recipient: "alice.42" },
      { channel: "telegram", recipient: "555" },
    ]);
  });
});
