import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getHealthFactorForWallet } from "~~/services/aave/getHealthFactor";
import { fakeSupabase, rangeOf, sliceByRange } from "~~/services/api/server/testing/fakeSupabase";
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
const NOW_TEXT_CS = "14. 10. 2026 9:05:07, koordinovaný světový čas";
const LOWER = `0x${"3a".repeat(20)}`;
const CHECKSUMMED = `0x${"3A".repeat(20)}`;
const OTHER = `0x${"56".repeat(20)}`;
const SHORT_LOWER = "0x3a3a…3a3a";
// Ethereum's Lido Spoke, as notification_configs.market stores it.
const LIDO_SPOKE = "0xe1900480ac69f0b296841cd01cc37546d92f35cd";

const configsPage = (from: number) =>
  'notification_configs.select("user_id, chain_id, market, health_factor_threshold, email, signal_recipient, telegram_username, services, locale, email_locale, signal_locale, telegram_locale")' +
  `.eq("enabled",true).order("id").range(${from},${from + 999})`;
const chatsPage = (from: number) =>
  `telegram_chats.select("username, chat_id").order("chat_id").range(${from},${from + 999})`;
const CONFIGS_QUERY = configsPage(0);
const CHATS_QUERY = chatsPage(0);
const deleteByChat = (chatId: string) => `telegram_chats.delete().eq("chat_id","${chatId}")`;
const deletes = () => fakeSupabase.log().filter(query => query.includes(".delete()"));

type Row = Record<string, unknown>;
const configRow = (overrides: Row = {}): Row => ({
  user_id: LOWER,
  chain_id: 8453,
  market: "v3",
  health_factor_threshold: "1.5",
  email: "a@b.co",
  signal_recipient: "alice.42",
  telegram_username: "alice_eth",
  services: ["email"],
  ...overrides,
});
// The chat that pressed Start as the default config row's Telegram username.
const ALICE_CHAT = { username: "alice_eth", chat_id: "555" };

const givenData = (rows: Row[], chats: Row[] = []) =>
  fakeSupabase.respondByQuery({ [CONFIGS_QUERY]: { data: rows }, [CHATS_QUERY]: { data: chats } });

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

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fakeSupabase.reset();
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.mocked(getHealthFactorForWallet).mockReset();
  vi.mocked(getHealthFactorForWallet).mockResolvedValue({
    healthFactor: "1.20",
    healthFactorValue: 1.2,
    chainName: "Base",
  });
  vi.mocked(sendEmail).mockReset();
  vi.mocked(sendEmail).mockResolvedValue({ success: true, id: "e1" });
  vi.mocked(sendSignalMessage).mockReset();
  vi.mocked(sendSignalMessage).mockResolvedValue({ success: true });
  vi.mocked(sendTelegramMessage).mockReset();
  vi.mocked(sendTelegramMessage).mockResolvedValue({ success: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("runNotificationCheck: loading", () => {
  it("fails with the Supabase message when the configs query errors, before loading the Telegram chats", async () => {
    fakeSupabase.respondByQuery({ [CONFIGS_QUERY]: { error: { message: "permission denied" } } });
    expect(await runNotificationCheck()).toEqual({ success: false, error: "permission denied" });
    expect(fakeSupabase.log()).toEqual([CONFIGS_QUERY]);
  });

  it("loads enabled configs and all Telegram chats page by page, omitting `errors` when there are none", async () => {
    givenData([]);
    const result = await runNotificationCheck();
    expect(JSON.stringify(result)).toBe(JSON.stringify(summary()));
    expect(fakeSupabase.log()).toEqual([CONFIGS_QUERY, CHATS_QUERY]);
  });

  it("reads enabled configs and Telegram chats past the 1000-row page limit (B3.7)", async () => {
    const wallet = (i: number) => `0x${i.toString(16).padStart(40, "0")}`;
    const configs = Array.from({ length: 1003 }, (_, i) =>
      configRow({ user_id: wallet(i), services: ["telegram"], telegram_username: `user_${i}` }),
    );
    const chats = Array.from({ length: 1003 }, (_, i) => ({ username: `user_${i}`, chat_id: `${i}` }));
    fakeSupabase.respond(query => ({
      data: sliceByRange(query, query.table === "notification_configs" ? configs : chats),
    }));
    vi.mocked(getHealthFactorForWallet).mockResolvedValue({
      healthFactor: "3.00",
      healthFactorValue: 3,
      chainName: "Base",
    });

    expect(await runNotificationCheck()).toEqual(summary({ configsChecked: 1003 }));
    expect(fakeSupabase.log()).toEqual([
      configsPage(0),
      configsPage(1000),
      configsPage(1003),
      chatsPage(0),
      chatsPage(1000),
      chatsPage(1003),
    ]);
  });

  it("fails the run when a later configs page errors", async () => {
    fakeSupabase.respond(query =>
      rangeOf(query)?.[0] === 0
        ? { data: Array.from({ length: 1000 }, () => configRow()) }
        : { error: { message: "timeout" } },
    );
    expect(await runNotificationCheck()).toEqual({ success: false, error: "timeout" });
    expect(getHealthFactorForWallet).not.toHaveBeenCalled();
  });

  it("skips Telegram for the run with an errors[] entry when the chats query fails (B3.7)", async () => {
    fakeSupabase.respondByQuery({
      [CONFIGS_QUERY]: {
        data: [
          configRow({ chain_id: 1, services: ["telegram"] }),
          configRow({ chain_id: 2, services: ["email", "telegram"] }),
        ],
      },
      [CHATS_QUERY]: { error: { message: "chats failed" } },
    });

    expect(await runNotificationCheck()).toEqual(
      summary({
        configsChecked: 1,
        emailsSent: 1,
        errors: ["telegram: chats query failed, Telegram alerts skipped this run: chats failed"],
      }),
    );
    expect(sendTelegramMessage).not.toHaveBeenCalled();
    expect(vi.mocked(getHealthFactorForWallet).mock.calls).toEqual([[LOWER, 2, "v3"]]);
  });

  it("checks only configs that have at least one deliverable channel", async () => {
    givenData(
      [
        configRow({ chain_id: 1, services: [] }),
        configRow({ chain_id: 2, services: null }),
        configRow({ chain_id: 3, services: ["email"], email: "   " }),
        configRow({ chain_id: 4, services: ["signal"], signal_recipient: null }),
        configRow({ chain_id: 5, services: ["telegram"], telegram_username: "not_started" }),
        configRow({ chain_id: 6, services: ["sms"] }),
        configRow({ chain_id: 7, services: ["email"] }),
        configRow({ chain_id: 8, services: ["telegram"] }),
        configRow({ chain_id: 9, services: "email" }),
        configRow({ chain_id: 10, services: ["telegram"], telegram_username: null }),
        configRow({ chain_id: 11, services: ["telegram"], telegram_username: undefined }),
      ],
      [{ username: "alice_eth", chat_id: 555 }],
    );
    vi.mocked(getHealthFactorForWallet).mockResolvedValue({
      healthFactor: "3.00",
      healthFactorValue: 3,
      chainName: "Base",
    });

    expect(await runNotificationCheck()).toEqual(summary({ configsChecked: 2 }));
    expect(vi.mocked(getHealthFactorForWallet).mock.calls).toEqual([
      [LOWER, 7, "v3"],
      [LOWER, 8, "v3"],
    ]);
  });

  it("sends Telegram to the chat its username pressed Start in, whichever wallet the config is for", async () => {
    givenData(
      [
        configRow({ chain_id: 1, user_id: CHECKSUMMED, services: ["telegram"] }),
        configRow({ chain_id: 2, user_id: OTHER, services: ["telegram"] }),
        configRow({ chain_id: 3, services: ["telegram"], telegram_username: "bob_eth" }),
      ],
      [ALICE_CHAT, { username: "bob_eth", chat_id: 777 }],
    );
    expect(await runNotificationCheck()).toEqual(summary({ configsChecked: 3, telegramSent: 3 }));
    expect(vi.mocked(sendTelegramMessage).mock.calls.map(([{ chatId }]) => chatId)).toEqual(["555", "555", "777"]);
  });

  it("does not check a Telegram-only config whose username has not pressed Start", async () => {
    givenData([configRow({ services: ["telegram"], telegram_username: "not_started" })], [ALICE_CHAT]);
    expect(await runNotificationCheck()).toEqual(summary());
    expect(getHealthFactorForWallet).not.toHaveBeenCalled();
    expect(sendTelegramMessage).not.toHaveBeenCalled();
  });

  it("still sends the other channels of a config whose Telegram username has no chat", async () => {
    givenData([configRow({ services: ["email", "telegram"], telegram_username: "not_started" })], [ALICE_CHAT]);
    expect(await runNotificationCheck()).toEqual(summary({ configsChecked: 1, emailsSent: 1 }));
    expect(sendTelegramMessage).not.toHaveBeenCalled();
  });

  it("does not check a Telegram-only config whose chat has an empty chat id", async () => {
    givenData([configRow({ services: ["telegram"] })], [{ username: "alice_eth", chat_id: "" }]);
    expect(await runNotificationCheck()).toEqual(summary());
    expect(getHealthFactorForWallet).not.toHaveBeenCalled();
    expect(sendTelegramMessage).not.toHaveBeenCalled();
  });
});

describe("runNotificationCheck: health factor", () => {
  it.each([
    ["it is infinite", { healthFactor: "∞", healthFactorValue: Infinity, chainName: "Base" }],
    ["it is unparseable", { healthFactor: "n/a", healthFactorValue: NaN, chainName: "Base" }],
    ["it equals the threshold", { healthFactor: "1.50", healthFactorValue: 1.5, chainName: "Base" }],
    ["it is above the threshold", { healthFactor: "1.51", healthFactorValue: 1.51, chainName: "Base" }],
  ])("does not alert when %s", async (_label, healthFactor) => {
    givenData([configRow()]);
    vi.mocked(getHealthFactorForWallet).mockResolvedValue(healthFactor);
    expect(await runNotificationCheck()).toEqual(summary({ configsChecked: 1 }));
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("alerts on the exact value when the 2-decimal display would round up to the threshold", async () => {
    givenData([configRow()]);
    vi.mocked(getHealthFactorForWallet).mockResolvedValue({
      healthFactor: "1.49",
      healthFactorValue: 1.4996,
      chainName: "Base",
    });
    expect(await runNotificationCheck()).toEqual(summary({ configsChecked: 1, emailsSent: 1 }));
    expect(vi.mocked(sendEmail).mock.calls[0][0].text).toContain("is 1.49, which is below your threshold of 1.5");
  });

  it("records an errors[] entry when the read fails and carries on (B3.12)", async () => {
    givenData([configRow({ chain_id: 1 }), configRow({ chain_id: 2 })]);
    vi.mocked(getHealthFactorForWallet).mockResolvedValueOnce(null);

    expect(await runNotificationCheck()).toEqual(
      summary({
        configsChecked: 2,
        emailsSent: 1,
        errors: [`healthFactor:${SHORT_LOWER}:1: could not read the health factor`],
      }),
    );
    expect(consoleError).toHaveBeenCalledWith(
      `Notification check: healthFactor:${LOWER}:1: could not read the health factor`,
    );
  });

  it.each([
    ["a V3 row", "v3", "v3"],
    ["a V4 row", LIDO_SPOKE, LIDO_SPOKE],
    ["a row from before the market column", undefined, "v3"],
    ["a null market", null, "v3"],
    ["a market the database would not store", "0x1234", "v3"],
  ])("reads the health factor in the market of %s", async (_label, market, expected) => {
    givenData([configRow({ chain_id: 1, market })]);
    await runNotificationCheck();
    expect(vi.mocked(getHealthFactorForWallet).mock.calls).toEqual([[LOWER, 1, expected]]);
  });

  it("alerts a V4 config under the market name the read returns", async () => {
    givenData([configRow({ chain_id: 1, market: LIDO_SPOKE })]);
    vi.mocked(getHealthFactorForWallet).mockResolvedValue({
      healthFactor: "1.20",
      healthFactorValue: 1.2,
      chainName: "Ethereum (V4 Lido)",
    });

    expect(await runNotificationCheck()).toEqual(summary({ configsChecked: 1, emailsSent: 1 }));
    expect(vi.mocked(sendEmail).mock.calls[0][0]).toMatchObject({
      subject: "Aave Health Factor Alert - Ethereum (V4 Lido)",
      text: alertText("Ethereum (V4 Lido)", "1.20", "1.5"),
    });
  });

  it("names a V4 config's failed read by its chain and Spoke, apart from the chain's V3 config", async () => {
    givenData([configRow({ chain_id: 1, market: LIDO_SPOKE }), configRow({ chain_id: 1 })]);
    vi.mocked(getHealthFactorForWallet).mockResolvedValue(null);

    expect(await runNotificationCheck()).toEqual(
      summary({
        configsChecked: 2,
        errors: [
          `healthFactor:${SHORT_LOWER}:1:${LIDO_SPOKE}: could not read the health factor`,
          `healthFactor:${SHORT_LOWER}:1: could not read the health factor`,
        ],
      }),
    );
    expect(consoleError).toHaveBeenCalledWith(
      `Notification check: healthFactor:${LOWER}:1:${LIDO_SPOKE}: could not read the health factor`,
    );
  });

  it.each([
    // The shared normalizeThreshold, as in the UI: falsy or unparseable values use the 1.5 default, then 1.1-10.
    ["0", "1.49", "1.5"],
    [null, "1.49", "1.5"],
    ["abc", "1.49", "1.5"],
    ["2.0", "1.99", "2"],
    [3, "2.5", "3"],
    ["0.5", "1.05", "1.1"],
    ["15", "9.99", "10"],
  ])("uses threshold %j (alerting at %s and printing %s)", async (stored, healthFactor, printed) => {
    givenData([configRow({ health_factor_threshold: stored })]);
    vi.mocked(getHealthFactorForWallet).mockResolvedValue({
      healthFactor,
      healthFactorValue: Number(healthFactor),
      chainName: "Base",
    });

    await runNotificationCheck();

    expect(vi.mocked(sendEmail).mock.calls[0][0].text).toBe(alertText("Base", healthFactor, printed));
  });

  it("clamps a stored threshold above the maximum (B3.12)", async () => {
    givenData([configRow({ health_factor_threshold: "15" })]);
    vi.mocked(getHealthFactorForWallet).mockResolvedValue({
      healthFactor: "12.00",
      healthFactorValue: 12,
      chainName: "Base",
    });
    expect(await runNotificationCheck()).toEqual(summary({ configsChecked: 1 }));
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe("runNotificationCheck: delivery", () => {
  it("alerts every channel in order with the exact copy", async () => {
    givenData(
      [configRow({ services: ["telegram", "signal", "email"], email: " a@b.co ", signal_recipient: " alice.42 " })],
      [{ username: "alice_eth", chat_id: 555 }],
    );

    const result = await runNotificationCheck();

    expect(JSON.stringify(result)).toBe(
      JSON.stringify(summary({ configsChecked: 1, emailsSent: 1, signalSent: 1, telegramSent: 1 })),
    );
    expect(getHealthFactorForWallet).toHaveBeenCalledExactlyOnceWith(LOWER, 8453, "v3");
    expect(sendEmail).toHaveBeenCalledExactlyOnceWith({
      to: "a@b.co",
      subject: "Aave Health Factor Alert - Base",
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

  it("alerts a Czech config in Czech on every channel: text, subject, decimal comma and timestamp", async () => {
    givenData(
      [configRow({ services: ["email", "signal", "telegram"], health_factor_threshold: "1.5", locale: "cs" })],
      [{ username: "alice_eth", chat_id: 555 }],
    );

    expect(await runNotificationCheck()).toEqual(
      summary({ configsChecked: 1, emailsSent: 1, signalSent: 1, telegramSent: 1 }),
    );

    const text =
      "Váš health factor na Aave na síti Base je 1,20, což je pod vaším prahem 1,5. " +
      "Zvažte doplnění kolaterálu nebo splacení dluhu, abyste se vyhnuli likvidaci.\n\n" +
      `Odesláno: ${NOW_TEXT_CS}`;
    expect(sendEmail).toHaveBeenCalledExactlyOnceWith({
      to: "a@b.co",
      subject: "Upozornění na health factor Aave - Base",
      text,
      html:
        "<p>Váš health factor na Aave na síti <strong>Base</strong> je <strong>1,20</strong>, " +
        "což je pod vaším prahem <strong>1,5</strong>.</p>" +
        "<p>Zvažte doplnění kolaterálu nebo splacení dluhu, abyste se vyhnuli likvidaci.</p>" +
        `<p><small>Vytvořeno: ${NOW_TEXT_CS}</small></p>`,
    });
    expect(sendSignalMessage).toHaveBeenCalledExactlyOnceWith({ to: "alice.42", message: text });
    expect(sendTelegramMessage).toHaveBeenCalledExactlyOnceWith({ chatId: "555", message: text });
  });

  it.each([
    ["no locale column (a row from before the migration)", {}],
    ["a null locale", { locale: null }],
    ["an unexpected locale", { locale: "de" }],
    ["an English locale", { locale: "en" }],
  ])("alerts in English for %s", async (_label, overrides) => {
    givenData([configRow(overrides)]);
    await runNotificationCheck();
    expect(sendEmail).toHaveBeenCalledExactlyOnceWith({
      to: "a@b.co",
      subject: "Aave Health Factor Alert - Base",
      text: alertText("Base", "1.20", "1.5"),
      html: alertHtml("Base", "1.20", "1.5"),
    });
  });

  it("alerts each channel in its own language, and channels without one in the config's", async () => {
    givenData(
      [
        configRow({
          services: ["email", "signal", "telegram"],
          health_factor_threshold: "1.5",
          locale: "cs",
          signal_locale: "en",
          telegram_locale: "cs",
        }),
      ],
      [{ username: "alice_eth", chat_id: 555 }],
    );

    expect(await runNotificationCheck()).toEqual(
      summary({ configsChecked: 1, emailsSent: 1, signalSent: 1, telegramSent: 1 }),
    );

    const czech =
      "Váš health factor na Aave na síti Base je 1,20, což je pod vaším prahem 1,5. " +
      "Zvažte doplnění kolaterálu nebo splacení dluhu, abyste se vyhnuli likvidaci.\n\n" +
      `Odesláno: ${NOW_TEXT_CS}`;
    expect(vi.mocked(sendEmail).mock.calls[0][0].subject).toBe("Upozornění na health factor Aave - Base");
    expect(sendSignalMessage).toHaveBeenCalledExactlyOnceWith({
      to: "alice.42",
      message: alertText("Base", "1.20", "1.5"),
    });
    expect(sendTelegramMessage).toHaveBeenCalledExactlyOnceWith({ chatId: "555", message: czech });
  });

  it("alerts an English config's Czech channel in Czech", async () => {
    givenData([configRow({ locale: "en", email_locale: "cs" })]);
    await runNotificationCheck();
    expect(vi.mocked(sendEmail).mock.calls[0][0].subject).toBe("Upozornění na health factor Aave - Base");
  });

  it("alerts each config in its own language", async () => {
    givenData([configRow({ chain_id: 1, locale: "cs" }), configRow({ chain_id: 2, locale: "en" })]);
    await runNotificationCheck();
    expect(vi.mocked(sendEmail).mock.calls.map(([options]) => options.subject)).toEqual([
      "Upozornění na health factor Aave - Base",
      "Aave Health Factor Alert - Base",
    ]);
  });

  it("formats the timestamp per alert", async () => {
    givenData([configRow({ chain_id: 1 }), configRow({ chain_id: 2 })]);
    vi.mocked(getHealthFactorForWallet)
      .mockResolvedValueOnce({ healthFactor: "1.20", healthFactorValue: 1.2, chainName: "Ethereum" })
      .mockImplementationOnce(async () => {
        vi.setSystemTime(new Date("2026-12-31T23:59:59.000Z"));
        return { healthFactor: "1.10", healthFactorValue: 1.1, chainName: "Polygon" };
      });

    await runNotificationCheck();

    expect(vi.mocked(sendEmail).mock.calls.map(([options]) => options.text)).toEqual([
      alertText("Ethereum", "1.20", "1.5"),
      alertText("Polygon", "1.10", "1.5", "Dec 31, 2026, 11:59:59 PM Coordinated Universal Time"),
    ]);
  });

  it("only sends to the channels the config selected", async () => {
    givenData([configRow({ services: ["signal"] })], [ALICE_CHAT]);
    expect(await runNotificationCheck()).toEqual(summary({ configsChecked: 1, signalSent: 1 }));
    expect(sendEmail).not.toHaveBeenCalled();
    expect(sendTelegramMessage).not.toHaveBeenCalled();
  });

  it("collects channel errors with masked recipients, logging the full detail", async () => {
    givenData(
      [configRow({ services: ["email", "signal", "telegram"] })],
      [{ username: "alice_eth", chat_id: "123456789" }],
    );
    vi.mocked(sendEmail).mockResolvedValue({ success: false, error: "Invalid email address" });
    vi.mocked(sendSignalMessage).mockResolvedValue({ success: false, error: "Signal API responded with 400: bad" });
    vi.mocked(sendTelegramMessage).mockResolvedValue({ success: false, error: "Forbidden", code: "api_error" });

    const result = await runNotificationCheck();

    expect(JSON.stringify(result)).toBe(
      JSON.stringify(
        summary({
          configsChecked: 1,
          errors: [
            "email:a***@b.co: Invalid email address",
            "signal:al***: Signal API responded with 400: bad",
            "telegram:***6789: Forbidden",
          ],
        }),
      ),
    );
    expect(consoleError.mock.calls).toEqual([
      ["Notification check: email:a@b.co: Invalid email address"],
      ["Notification check: signal:alice.42: Signal API responded with 400: bad"],
      ["Notification check: telegram:123456789: Forbidden"],
    ]);
    expect(deletes()).toEqual([]);
  });

  it("masks recipients that a provider error echoes", async () => {
    givenData(
      [configRow({ services: ["email", "signal", "telegram"] })],
      [{ username: "alice_eth", chat_id: "123456789" }],
    );
    vi.mocked(sendEmail).mockResolvedValue({ success: false, error: "a@b.co bounced" });
    vi.mocked(sendSignalMessage).mockResolvedValue({ success: false, error: 'Invalid Signal username "alice.42"' });
    vi.mocked(sendTelegramMessage).mockResolvedValue({
      success: false,
      error: "chat 123456789 not reachable",
      code: "api_error",
    });

    const result = await runNotificationCheck();

    expect(result).toMatchObject({
      errors: [
        "email:a***@b.co: a***@b.co bounced",
        'signal:al***: Invalid Signal username "al***"',
        "telegram:***6789: chat ***6789 not reachable",
      ],
    });
    expect(JSON.stringify(result)).not.toMatch(/a@b\.co|alice\.42|123456789/);
  });

  it.each(["bot_blocked", "chat_not_found"] as const)(
    "drops the Telegram chat on %s and skips it for every later config naming the username",
    async code => {
      givenData(
        [
          configRow({ chain_id: 1, services: ["telegram", "email"] }),
          configRow({ chain_id: 2, services: ["telegram", "email"] }),
          configRow({ chain_id: 3, user_id: OTHER, services: ["telegram", "email"] }),
        ],
        [ALICE_CHAT],
      );
      vi.mocked(sendTelegramMessage).mockResolvedValue({ success: false, error: "blocked", code });

      const result = await runNotificationCheck();

      expect(result).toEqual(
        summary({ configsChecked: 3, emailsSent: 3, telegramSent: 0, errors: ["telegram:***: blocked"] }),
      );
      expect(sendTelegramMessage).toHaveBeenCalledOnce();
      expect(deletes()).toEqual([deleteByChat("555")]);
    },
  );

  it("keeps alerting other usernames' chats after one chat dies", async () => {
    givenData(
      [
        configRow({ chain_id: 1, services: ["telegram"] }),
        configRow({ chain_id: 2, services: ["telegram"], telegram_username: "bob_eth" }),
        configRow({ chain_id: 3, services: ["telegram"] }),
      ],
      [ALICE_CHAT, { username: "bob_eth", chat_id: "777" }],
    );
    vi.mocked(sendTelegramMessage).mockImplementation(async ({ chatId }) =>
      chatId === "555" ? { success: false, error: "blocked", code: "bot_blocked" } : { success: true },
    );

    expect(await runNotificationCheck()).toEqual(
      summary({ configsChecked: 3, telegramSent: 1, errors: ["telegram:***: blocked"] }),
    );
    expect(vi.mocked(sendTelegramMessage).mock.calls.map(([{ chatId }]) => chatId)).toEqual(["555", "777"]);
    expect(deletes()).toEqual([deleteByChat("555")]);
  });

  it("skips every username that pointed at the dead chat", async () => {
    givenData(
      [
        configRow({ chain_id: 1, services: ["telegram"] }),
        configRow({ chain_id: 2, services: ["telegram"], telegram_username: "old_name" }),
      ],
      [ALICE_CHAT, { username: "old_name", chat_id: "555" }],
    );
    vi.mocked(sendTelegramMessage).mockResolvedValue({ success: false, error: "gone", code: "chat_not_found" });

    await runNotificationCheck();

    expect(sendTelegramMessage).toHaveBeenCalledOnce();
    expect(deletes()).toEqual([deleteByChat("555")]);
  });

  it("logs a failed dead-chat delete and still skips the chat for the rest of the run", async () => {
    fakeSupabase.respond((_query, formatted) => {
      if (formatted === CONFIGS_QUERY) {
        return {
          data: [
            configRow({ chain_id: 1, services: ["telegram"] }),
            configRow({ chain_id: 2, services: ["telegram", "email"] }),
          ],
        };
      }
      if (formatted === CHATS_QUERY) return { data: [ALICE_CHAT] };
      if (formatted === deleteByChat("555")) return { error: { message: "delete failed" } };
    });
    vi.mocked(sendTelegramMessage).mockResolvedValue({ success: false, error: "blocked", code: "bot_blocked" });

    expect(await runNotificationCheck()).toEqual(
      summary({ configsChecked: 2, emailsSent: 1, errors: ["telegram:***: blocked"] }),
    );
    expect(sendTelegramMessage).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith("Notification check: could not remove the dead Telegram chat 555", {
      message: "delete failed",
    });
  });

  it.each(["rate_limited", "network", "misconfigured", "api_error"] as const)("keeps the chat on %s", async code => {
    givenData(
      [configRow({ chain_id: 1, services: ["telegram"] }), configRow({ chain_id: 2, services: ["telegram"] })],
      [ALICE_CHAT],
    );
    vi.mocked(sendTelegramMessage).mockResolvedValue({ success: false, error: "x", code });

    const result = await runNotificationCheck();

    expect(result).toMatchObject({ errors: ["telegram:***: x", "telegram:***: x"] });
    expect(sendTelegramMessage).toHaveBeenCalledTimes(2);
    expect(deletes()).toEqual([]);
  });

  it("records a config that throws and carries on with the rest (B3.8)", async () => {
    givenData([configRow({ chain_id: 1 }), configRow({ chain_id: 2 })]);
    vi.mocked(getHealthFactorForWallet).mockRejectedValueOnce(new Error("rpc exploded"));

    expect(await runNotificationCheck()).toEqual(
      summary({ configsChecked: 2, emailsSent: 1, errors: [`config:${SHORT_LOWER}:1: rpc exploded`] }),
    );
    expect(consoleError).toHaveBeenCalledWith(`Notification check: config:${LOWER}:1: rpc exploded`);
  });

  it("records a V4 config that throws by its chain and Spoke", async () => {
    givenData([configRow({ chain_id: 1, market: LIDO_SPOKE })]);
    vi.mocked(getHealthFactorForWallet).mockRejectedValueOnce(new Error("rpc exploded"));

    expect(await runNotificationCheck()).toEqual(
      summary({ configsChecked: 1, errors: [`config:${SHORT_LOWER}:1:${LIDO_SPOKE}: rpc exploded`] }),
    );
    expect(consoleError).toHaveBeenCalledWith(`Notification check: config:${LOWER}:1:${LIDO_SPOKE}: rpc exploded`);
  });

  it.each([
    ["'Unknown error' for a non-Error throw", "nope", "Unknown error"],
    [
      "a thrown message with the recipient masked",
      new Error("socket closed for a@b.co"),
      "socket closed for a***@b.co",
    ],
  ])("records %s", async (_label, thrown, recorded) => {
    givenData([configRow()]);
    vi.mocked(sendEmail).mockRejectedValue(thrown);
    expect(await runNotificationCheck()).toEqual(
      summary({ configsChecked: 1, errors: [`config:${SHORT_LOWER}:8453: ${recorded}`] }),
    );
  });

  it("still fails the whole run when loading throws", async () => {
    fakeSupabase.respond(() => {
      throw new Error("db down");
    });
    expect(await runNotificationCheck()).toEqual({ success: false, error: "db down" });
  });
});

describe("alert builders", () => {
  const alert = { chainName: "Arbitrum One", healthFactor: "1.07", threshold: 1.25, timestamp: NOW_TEXT };

  it("builds the text exactly as the inline template did", () => {
    expect(buildAlertText(alert)).toBe(alertText("Arbitrum One", "1.07", "1.25"));
  });

  it("builds the Czech text with decimal commas", () => {
    expect(buildAlertText({ ...alert, timestamp: NOW_TEXT_CS }, "cs")).toBe(
      "Váš health factor na Aave na síti Arbitrum One je 1,07, což je pod vaším prahem 1,25. " +
        "Zvažte doplnění kolaterálu nebo splacení dluhu, abyste se vyhnuli likvidaci.\n\n" +
        `Odesláno: ${NOW_TEXT_CS}`,
    );
  });

  it("calls a V4 Spoke a market in Czech, not a network", () => {
    const spoke = { ...alert, chainName: "Ethereum (V4 Lido)", timestamp: NOW_TEXT_CS };

    expect(buildAlertText(spoke, "cs")).toMatch(/^Váš health factor na Aave na trhu Ethereum \(V4 Lido\) je 1,07,/);
    expect(buildAlertEmail(spoke, "cs").html).toContain("na Aave na trhu <strong>Ethereum (V4 Lido)</strong> je");
    expect(buildAlertText(spoke)).toMatch(/^Your Aave Health Factor on Ethereum \(V4 Lido\) is 1.07,/);
  });

  it("builds the email subject (spaced hyphen) and html ('Created at' footer)", () => {
    expect(buildAlertEmail(alert)).toStrictEqual({
      subject: "Aave Health Factor Alert - Arbitrum One",
      html: alertHtml("Arbitrum One", "1.07", "1.25"),
    });
  });
});

describe("getDeliverableChannels", () => {
  const chats = new Map([["alice_eth", "555"]]);
  const asRow = (overrides: Row) => configRow(overrides) as EnabledConfigRow;

  it.each([
    [
      { services: ["telegram", "signal", "email"], email: " a@b.co ", signal_recipient: " alice.42 " },
      ["email", "signal", "telegram"],
    ],
    [{ services: ["email"], email: "  " }, []],
    [{ services: ["signal"], signal_recipient: null }, []],
    // Telegram follows the username, not the wallet.
    [{ services: ["telegram"], user_id: OTHER }, ["telegram"]],
    [{ services: ["telegram"], user_id: CHECKSUMMED }, ["telegram"]],
    [{ services: ["telegram"], telegram_username: " alice_eth " }, ["telegram"]],
    [{ services: ["telegram"], telegram_username: "not_started" }, []],
    [{ services: ["telegram"], telegram_username: null }, []],
    [{ services: ["telegram"], telegram_username: undefined }, []],
    [{ services: ["telegram"], telegram_username: "  " }, []],
    // Looked up as stored: the database keeps usernames lowercased.
    [{ services: ["telegram"], telegram_username: "Alice_Eth" }, []],
    [{ services: ["email"], telegram_username: "alice_eth" }, ["email"]],
    [{ services: [] }, []],
    [{ services: null }, []],
    [{ services: "email" }, []],
    [{ services: ["sms"] }, []],
  ])("for %j returns channels %j", (overrides, channels) => {
    expect(getDeliverableChannels(asRow(overrides), chats).map(({ channel }) => channel)).toEqual(channels);
  });

  it.each(["", "  "])("leaves out Telegram for a chat with the empty chat id %j", chatId => {
    expect(getDeliverableChannels(asRow({ services: ["telegram"] }), new Map([["alice_eth", chatId]]))).toStrictEqual(
      [],
    );
  });

  it("leaves out Telegram when no chat is linked at all", () => {
    expect(getDeliverableChannels(asRow({ services: ["telegram"] }), new Map())).toStrictEqual([]);
  });

  it("returns trimmed recipients and the username's chat id", () => {
    expect(
      getDeliverableChannels(
        asRow({ services: ["email", "signal", "telegram"], email: " a@b.co ", signal_recipient: "\talice.42 " }),
        chats,
      ),
    ).toStrictEqual([
      { channel: "email", recipient: "a@b.co" },
      { channel: "signal", recipient: "alice.42" },
      { channel: "telegram", recipient: "555" },
    ]);
  });
});
