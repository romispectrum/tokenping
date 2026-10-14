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
const LOWER = `0x${"3a".repeat(20)}`;
const CHECKSUMMED = `0x${"3A".repeat(20)}`;
const OTHER = `0x${"56".repeat(20)}`;
const SHORT_LOWER = "0x3a3a…3a3a";

const configsPage = (from: number) =>
  'notification_configs.select("user_id, chain_id, health_factor_threshold, email, signal_recipient, services")' +
  `.eq("enabled",true).order("id").range(${from},${from + 999})`;
const linksPage = (from: number) =>
  `user_telegram_links.select("user_id, chat_id").order("user_id").range(${from},${from + 999})`;
const CONFIGS_QUERY = configsPage(0);
const LINKS_QUERY = linksPage(0);
const deleteByChat = (chatId: string) => `user_telegram_links.delete().eq("chat_id","${chatId}")`;
const deletes = () => fakeSupabase.log().filter(query => query.includes(".delete()"));

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

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fakeSupabase.reset();
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
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
  vi.restoreAllMocks();
});

describe("runNotificationCheck: loading", () => {
  it("fails with the Supabase message when the configs query errors, before loading links", async () => {
    fakeSupabase.respondByQuery({ [CONFIGS_QUERY]: { error: { message: "permission denied" } } });
    expect(await runNotificationCheck()).toEqual({ success: false, error: "permission denied" });
    expect(fakeSupabase.log()).toEqual([CONFIGS_QUERY]);
  });

  it("loads enabled configs and all Telegram links page by page, omitting `errors` when there are none", async () => {
    givenData([]);
    const result = await runNotificationCheck();
    expect(JSON.stringify(result)).toBe(JSON.stringify(summary()));
    expect(fakeSupabase.log()).toEqual([CONFIGS_QUERY, LINKS_QUERY]);
  });

  it("reads enabled configs and links past the 1000-row page limit (B3.7)", async () => {
    const wallet = (i: number) => `0x${i.toString(16).padStart(40, "0")}`;
    const wallets = Array.from({ length: 1003 }, (_, i) => wallet(i));
    const configs = wallets.map(user_id => configRow({ user_id, services: ["telegram"] }));
    const links = wallets.map((user_id, i) => ({ user_id, chat_id: `${i}` }));
    fakeSupabase.respond(query => ({
      data: sliceByRange(query, query.table === "notification_configs" ? configs : links),
    }));
    vi.mocked(getHealthFactorForWallet).mockResolvedValue({ healthFactor: "3.00", chainName: "Base" });

    expect(await runNotificationCheck()).toEqual(summary({ configsChecked: 1003 }));
    expect(fakeSupabase.log()).toEqual([
      configsPage(0),
      configsPage(1000),
      configsPage(1003),
      linksPage(0),
      linksPage(1000),
      linksPage(1003),
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

  it("skips Telegram for the run with an errors[] entry when the links query fails (B3.7)", async () => {
    fakeSupabase.respondByQuery({
      [CONFIGS_QUERY]: {
        data: [
          configRow({ chain_id: 1, services: ["telegram"] }),
          configRow({ chain_id: 2, services: ["email", "telegram"] }),
        ],
      },
      [LINKS_QUERY]: { error: { message: "links failed" } },
    });

    expect(await runNotificationCheck()).toEqual(
      summary({
        configsChecked: 1,
        emailsSent: 1,
        errors: ["telegram: links query failed, Telegram alerts skipped this run: links failed"],
      }),
    );
    expect(sendTelegramMessage).not.toHaveBeenCalled();
    expect(vi.mocked(getHealthFactorForWallet).mock.calls).toEqual([[LOWER, 2]]);
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

  it("matches Telegram links for a checksummed (legacy) config user_id (B3.13)", async () => {
    givenData([configRow({ user_id: CHECKSUMMED, services: ["telegram"] })], [{ user_id: LOWER, chat_id: "555" }]);
    expect(await runNotificationCheck()).toEqual(summary({ configsChecked: 1, telegramSent: 1 }));
    expect(sendTelegramMessage).toHaveBeenCalledExactlyOnceWith({
      chatId: "555",
      message: alertText("Base", "1.20", "1.5"),
    });
  });

  it("does not check a Telegram-only config whose link has an empty chat id", async () => {
    givenData([configRow({ services: ["telegram"] })], [{ user_id: LOWER, chat_id: "" }]);
    expect(await runNotificationCheck()).toEqual(summary());
    expect(getHealthFactorForWallet).not.toHaveBeenCalled();
    expect(sendTelegramMessage).not.toHaveBeenCalled();
  });
});

describe("runNotificationCheck: health factor", () => {
  it.each([
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
    vi.mocked(getHealthFactorForWallet).mockResolvedValue({ healthFactor, chainName: "Base" });

    await runNotificationCheck();

    expect(vi.mocked(sendEmail).mock.calls[0][0].text).toBe(alertText("Base", healthFactor, printed));
  });

  it("clamps a stored threshold above the maximum (B3.12)", async () => {
    givenData([configRow({ health_factor_threshold: "15" })]);
    vi.mocked(getHealthFactorForWallet).mockResolvedValue({ healthFactor: "12.00", chainName: "Base" });
    expect(await runNotificationCheck()).toEqual(summary({ configsChecked: 1 }));
    expect(sendEmail).not.toHaveBeenCalled();
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

  it("only sends to the channels the config selected", async () => {
    givenData([configRow({ services: ["signal"] })], [{ user_id: LOWER, chat_id: "555" }]);
    expect(await runNotificationCheck()).toEqual(summary({ configsChecked: 1, signalSent: 1 }));
    expect(sendEmail).not.toHaveBeenCalled();
    expect(sendTelegramMessage).not.toHaveBeenCalled();
  });

  it("collects channel errors with masked recipients, logging the full detail", async () => {
    givenData([configRow({ services: ["email", "signal", "telegram"] })], [{ user_id: LOWER, chat_id: "123456789" }]);
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
    givenData([configRow({ services: ["email", "signal", "telegram"] })], [{ user_id: LOWER, chat_id: "123456789" }]);
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
        summary({ configsChecked: 2, emailsSent: 2, telegramSent: 0, errors: ["telegram:***: blocked"] }),
      );
      expect(sendTelegramMessage).toHaveBeenCalledOnce();
      expect(deletes()).toEqual([deleteByChat("555")]);
    },
  );

  it("drops the dead chat of a checksummed config user_id for the user's remaining configs", async () => {
    givenData(
      [
        configRow({ chain_id: 1, user_id: CHECKSUMMED, services: ["telegram"] }),
        configRow({ chain_id: 2, services: ["telegram", "email"] }),
      ],
      [{ user_id: LOWER, chat_id: "555" }],
    );
    vi.mocked(sendTelegramMessage).mockResolvedValue({ success: false, error: "blocked", code: "bot_blocked" });

    await runNotificationCheck();

    expect(sendTelegramMessage).toHaveBeenCalledOnce();
  });

  it("logs a failed dead-link delete and still skips the chat for the rest of the run", async () => {
    fakeSupabase.respond((_query, formatted) => {
      if (formatted === CONFIGS_QUERY) {
        return {
          data: [
            configRow({ chain_id: 1, services: ["telegram"] }),
            configRow({ chain_id: 2, services: ["telegram", "email"] }),
          ],
        };
      }
      if (formatted === LINKS_QUERY) return { data: [{ user_id: LOWER, chat_id: "555" }] };
      if (formatted === deleteByChat("555")) return { error: { message: "delete failed" } };
    });
    vi.mocked(sendTelegramMessage).mockResolvedValue({ success: false, error: "blocked", code: "bot_blocked" });

    expect(await runNotificationCheck()).toEqual(
      summary({ configsChecked: 2, emailsSent: 1, errors: ["telegram:***: blocked"] }),
    );
    expect(sendTelegramMessage).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith("Notification check: could not remove the dead Telegram link 555", {
      message: "delete failed",
    });
  });

  it.each(["rate_limited", "network", "misconfigured", "api_error"] as const)("keeps the link on %s", async code => {
    givenData(
      [configRow({ chain_id: 1, services: ["telegram"] }), configRow({ chain_id: 2, services: ["telegram"] })],
      [{ user_id: LOWER, chat_id: "555" }],
    );
    vi.mocked(sendTelegramMessage).mockResolvedValue({ success: false, error: "x", code });

    const result = await runNotificationCheck();

    expect(result).toMatchObject({ errors: ["telegram:***: x", "telegram:***: x"] });
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
    [{ services: ["telegram"], user_id: CHECKSUMMED }, ["telegram"]],
    [{ services: ["telegram"], user_id: ` ${CHECKSUMMED} ` }, ["telegram"]],
    [{ services: [] }, []],
    [{ services: null }, []],
    [{ services: "email" }, []],
    [{ services: ["sms"] }, []],
  ])("for %j returns channels %j", (overrides, channels) => {
    expect(getDeliverableChannels(asRow(overrides), links).map(({ channel }) => channel)).toEqual(channels);
  });

  it.each(["", "  "])("leaves out Telegram for a link with the empty chat id %j", chatId => {
    expect(getDeliverableChannels(asRow({ services: ["telegram"] }), new Map([[LOWER, chatId]]))).toStrictEqual([]);
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
