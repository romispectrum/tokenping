import { describe, expect, it } from "vitest";
import {
  EMPTY_FORM_STATE,
  NOTIFICATION_FORM_ERRORS,
  buildConfigUpdate,
  channelLocaleOf,
  configToFormState,
  countFormFields,
  getNotificationFormErrors,
  needsErrorSummary,
  toggleService,
  validateNotificationForm,
} from "~~/components/custom/notifications/notificationForm";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";
import type { NotificationConfig, NotificationService } from "~~/types/notifications";
import { MORPHO_THRESHOLD_RANGE } from "~~/utils/notifications/threshold";

/*
 * Reference versions of the original NotificationConfig.tsx logic (handleStore and saveConfig), written out with
 * literal regexes and limits and compared with the module over an input matrix. They check the order of the checks,
 * the presence rules and the payload shape. They carry the deliberate changes: the Signal prefix rule (B0.11: an
 * optional "u:" then an optional "@", as on the server), as a copy of that rule, so the explicit Signal cases in
 * validateNotificationForm and buildConfigUpdate are what pin it; the messages, rewritten to say how to fix the
 * field now that they show under it; and Telegram as a typed username like Signal's (it used to need a chat linked
 * to the wallet), which saves whether or not that account has pressed Start in the bot yet.
 */
const referenceNormalizeSignal = (raw: string) => raw.trim().replace(/^(?:u:)?@?/, "");
const referenceNormalizeTelegram = (raw: string) =>
  raw
    .trim()
    .replace(/^(?:https?:\/\/)?(?:www\.)?(?:t|telegram)\.me\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "")
    .toLowerCase();
const referenceClampThreshold = (value: number) => Math.min(10, Math.max(1.1, value));

const referenceValidate = (
  services: NotificationService[],
  email: string,
  signalRecipient: string,
  telegramUsername: string,
) => {
  if (services.length === 0) return "Select at least one notification service.";
  if (services.includes("email")) {
    const trimmed = email.trim();
    if (!trimmed) return "Enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter an email address like name@example.com.";
  }
  if (services.includes("signal")) {
    const username = referenceNormalizeSignal(signalRecipient);
    if (!username) return "Enter your Signal username.";
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_]{0,29}\.\d{2,}$/.test(username)) {
      return "Enter a Signal username like alice.42. Find yours in Signal under Settings, then Profile.";
    }
  }
  if (services.includes("telegram")) {
    const username = referenceNormalizeTelegram(telegramUsername);
    if (!username) return "Enter your Telegram username.";
    if (telegramUsername.length > 64 || !/^[a-z][a-z0-9_]{2,30}[a-z0-9]$/.test(username)) {
      return "Enter a Telegram username like alice_eth: 4 to 32 letters, digits or underscores, starting with a letter and not ending with _.";
    }
  }
  return null;
};

const referencePayload = (
  services: NotificationService[],
  email: string,
  signalRecipient: string,
  telegramUsername: string,
  threshold: number,
) => ({
  enabled: true,
  services,
  healthFactorThreshold: referenceClampThreshold(Math.round(threshold * 100) / 100),
  email: services.includes("email") ? email.trim() || undefined : undefined,
  signalRecipient: services.includes("signal") ? referenceNormalizeSignal(signalRecipient) || undefined : undefined,
  telegramUsername: services.includes("telegram")
    ? referenceNormalizeTelegram(telegramUsername) || undefined
    : undefined,
  // No language picked and no page language given: every selected channel in English.
  channelLocales: Object.fromEntries(services.map(service => [service, "en"])),
});

const SERVICE_SETS: NotificationService[][] = [
  [],
  ["email"],
  ["signal"],
  ["telegram"],
  ["email", "signal"],
  ["signal", "email", "telegram"],
];
const EMAILS = ["", "   ", "me@example.com", "  me@example.com  ", "me@example", "a b@c.de", "@x.io"];
const SIGNALS = [
  "",
  " ",
  "@",
  "u:",
  "@@alice.42",
  "alice.42",
  " @alice.42 ",
  "u:alice.42",
  " u:@alice.42 ",
  "u: alice.42",
  "ursula.42",
  "_alice.42",
  "alice.4",
  "alice",
];
const TELEGRAMS = [
  "",
  "  ",
  "@",
  "https://t.me/",
  "alice_eth",
  " @Alice_Eth ",
  "https://t.me/alice_eth/",
  "telegram.me/Alice_Eth",
  "@@alice_eth",
  "abcd",
  "abc",
  "1alice",
  "alice_",
  "alice-eth",
  "a".repeat(32),
  "a".repeat(33),
  // A valid name, but more than the 64 characters the input takes.
  `${" ".repeat(40)}alice_eth${" ".repeat(20)}`,
];

const CONFIG: NotificationConfig = {
  chainId: 42161,
  enabled: true,
  services: ["email", "signal", "telegram"],
  healthFactorThreshold: 1.8,
  email: "me@example.com",
  signalRecipient: "alice.42",
  telegramUsername: "alice_eth",
};

describe("EMPTY_FORM_STATE", () => {
  it("is the reset state: nothing selected and the default 1.50 threshold", () => {
    expect(EMPTY_FORM_STATE).toStrictEqual({
      enabled: false,
      services: [],
      email: "",
      signalRecipient: "",
      telegramUsername: "",
      threshold: 1.5,
      thresholdText: "1.50",
      channelLocales: {},
    });
  });
});

describe("configToFormState", () => {
  // Cancel and the initial load go through this one function, so a legacy config reads the same after Cancel (B0.8).
  it("is the empty state without a saved config", () => {
    expect(configToFormState(null)).toBe(EMPTY_FORM_STATE);
  });

  it("copies a saved config", () => {
    expect(configToFormState(CONFIG)).toStrictEqual({
      enabled: true,
      services: ["email", "signal", "telegram"],
      email: "me@example.com",
      signalRecipient: "alice.42",
      telegramUsername: "alice_eth",
      threshold: 1.8,
      thresholdText: "1.80",
      channelLocales: {},
    });
  });

  it("copies each channel's saved language, dropping unknown channels and languages", () => {
    const channelLocales = {
      email: "cs",
      signal: "en",
      telegram: "fr",
      sms: "cs",
    } as unknown as NotificationConfig["channelLocales"];
    expect(configToFormState({ ...CONFIG, channelLocales }).channelLocales).toStrictEqual({
      email: "cs",
      signal: "en",
    });
  });

  it("drops unknown services and falls back to email only for enabled configs", () => {
    const legacy = { ...CONFIG, services: ["sms", "push"] as unknown as NotificationService[] };
    expect(configToFormState(legacy).services).toEqual(["email"]);
    expect(configToFormState({ ...legacy, enabled: false }).services).toEqual([]);
    expect(
      configToFormState({ ...CONFIG, services: ["sms", "signal"] as unknown as NotificationService[] }).services,
    ).toEqual(["signal"]);
  });

  it("tolerates fields missing from the API body", () => {
    const partial = { chainId: 1 } as unknown as NotificationConfig;
    expect(configToFormState(partial)).toStrictEqual(EMPTY_FORM_STATE);
  });

  it.each([
    [0, 1.5, "1.50"],
    [Number.NaN, 1.5, "1.50"],
    ["2.345" as unknown as number, 2.345, "2.35"],
    [1, 1.1, "1.10"],
    [42, 10, "10.00"],
  ])("normalizes threshold %s to %s (%s)", (healthFactorThreshold, threshold, thresholdText) => {
    const state = configToFormState({ ...CONFIG, healthFactorThreshold });
    expect([state.threshold, state.thresholdText]).toEqual([threshold, thresholdText]);
  });
});

describe("channelLocaleOf", () => {
  it("is the language picked for the channel, else the page's", () => {
    const form = { channelLocales: { signal: "cs" } as const };
    expect(channelLocaleOf(form, "signal", "en")).toBe("cs");
    expect(channelLocaleOf(form, "email", "en")).toBe("en");
    expect(channelLocaleOf(form, "email", "cs")).toBe("cs");
  });
});

describe("toggleService", () => {
  it("appends a missing service and removes a selected one, without mutating the input", () => {
    const services: NotificationService[] = ["signal"];
    expect(toggleService(services, "email")).toEqual(["signal", "email"]);
    expect(toggleService(["email", "signal", "telegram"], "signal")).toEqual(["email", "telegram"]);
    expect(services).toEqual(["signal"]);
  });
});

describe("validateNotificationForm", () => {
  const form = { services: [] as NotificationService[], email: "", signalRecipient: "", telegramUsername: "" };

  it.each([
    [{}, NOTIFICATION_FORM_ERRORS.noService],
    [{ services: ["email"], email: "  " }, NOTIFICATION_FORM_ERRORS.noEmail],
    [{ services: ["email"], email: "me@example" }, NOTIFICATION_FORM_ERRORS.invalidEmail],
    [{ services: ["signal"], signalRecipient: " @ " }, NOTIFICATION_FORM_ERRORS.noSignal],
    [{ services: ["signal"], signalRecipient: "u:" }, NOTIFICATION_FORM_ERRORS.noSignal],
    [{ services: ["signal"], signalRecipient: "u: alice.42" }, NOTIFICATION_FORM_ERRORS.invalidSignal],
    [{ services: ["signal"], signalRecipient: "@@alice.42" }, NOTIFICATION_FORM_ERRORS.invalidSignal],
    // The client accepts the same "u:" form as the server (B0.11) and keeps a leading "u" of the name (B3.1).
    [{ services: ["signal"], signalRecipient: "u:alice.42" }, null],
    [{ services: ["signal"], signalRecipient: " u:@alice.42 " }, null],
    [{ services: ["signal"], signalRecipient: "ursula.42" }, null],
    [{ services: ["telegram"] }, NOTIFICATION_FORM_ERRORS.noTelegram],
    [{ services: ["telegram"], telegramUsername: " @ " }, NOTIFICATION_FORM_ERRORS.noTelegram],
    [{ services: ["telegram"], telegramUsername: "https://t.me/" }, NOTIFICATION_FORM_ERRORS.noTelegram],
    [{ services: ["telegram"], telegramUsername: "rom" }, NOTIFICATION_FORM_ERRORS.invalidTelegram],
    [{ services: ["telegram"], telegramUsername: "alice-eth" }, NOTIFICATION_FORM_ERRORS.invalidTelegram],
    [{ services: ["telegram"], telegramUsername: "alice_" }, NOTIFICATION_FORM_ERRORS.invalidTelegram],
    [{ services: ["telegram"], telegramUsername: "1alice" }, NOTIFICATION_FORM_ERRORS.invalidTelegram],
    // Pasted the way Telegram shows it: with "@", in capitals or as a t.me link.
    [{ services: ["telegram"], telegramUsername: " @Alice_Eth " }, null],
    [{ services: ["telegram"], telegramUsername: "https://t.me/alice_eth" }, null],
    // Not checked while Telegram is not selected.
    [{ services: ["email"], email: "me@example.com", telegramUsername: "rom" }, null],
    [
      {
        services: ["email", "signal", "telegram"],
        email: " me@example.com ",
        signalRecipient: " @alice.42 ",
        telegramUsername: "@alice_eth",
      },
      null,
    ],
  ])("%j -> %s", (overrides, expected) => {
    expect(validateNotificationForm({ ...form, ...overrides } as typeof form)).toBe(expected);
  });

  it("reports the first problem in field order", () => {
    expect(
      validateNotificationForm({
        services: ["telegram", "signal", "email"],
        email: "",
        signalRecipient: "",
        telegramUsername: "",
      }),
    ).toBe(NOTIFICATION_FORM_ERRORS.noEmail);
  });

  it("matches the reference checks for every combination", () => {
    for (const services of SERVICE_SETS)
      for (const email of EMAILS)
        for (const signalRecipient of SIGNALS)
          for (const telegramUsername of TELEGRAMS) {
            expect(validateNotificationForm({ services, email, signalRecipient, telegramUsername })).toBe(
              referenceValidate(services, email, signalRecipient, telegramUsername),
            );
          }
  });
});

describe("getNotificationFormErrors", () => {
  it("reports every problem at once, each under its own field", () => {
    expect(
      getNotificationFormErrors({
        services: ["telegram", "signal", "email"],
        email: "me@example",
        signalRecipient: "",
        telegramUsername: "@",
      }),
    ).toStrictEqual({
      email: NOTIFICATION_FORM_ERRORS.invalidEmail,
      signalRecipient: NOTIFICATION_FORM_ERRORS.noSignal,
      telegram: NOTIFICATION_FORM_ERRORS.noTelegram,
    });
  });

  it("asks only for a service when none is selected, and is empty for a valid form", () => {
    expect(
      getNotificationFormErrors({ services: [], email: "", signalRecipient: "", telegramUsername: "" }),
    ).toStrictEqual({
      services: NOTIFICATION_FORM_ERRORS.noService,
    });
    expect(
      getNotificationFormErrors({
        services: ["email", "telegram"],
        email: "me@example.com",
        signalRecipient: "",
        telegramUsername: "alice_eth",
      }),
    ).toStrictEqual({});
  });

  it("does not ask for the Telegram account to have pressed Start: a valid username is enough to save", () => {
    // The form knows nothing about the link; the status line under the field says whether Start was pressed.
    expect(
      getNotificationFormErrors({
        services: ["telegram"],
        email: "",
        signalRecipient: "",
        telegramUsername: "x_never",
      }),
    ).toStrictEqual({});
  });

  it("writes every message as a sentence that says what to do, without dashes", () => {
    // En and em dash, built from their code points so this file does not contain them, even as escapes.
    const dashes = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
    for (const message of Object.values(NOTIFICATION_FORM_ERRORS)) {
      expect(message).toMatch(/^(?:Select|Enter) .+\.$/);
      expect(message).not.toMatch(dashes);
    }
  });
});

describe("needsErrorSummary", () => {
  it("asks for the summary once the form shows more than 3 fields: two services or more", () => {
    expect([[], ["email"], ["telegram"]].map(services => needsErrorSummary(services as NotificationService[]))).toEqual(
      [false, false, false],
    );
    expect(needsErrorSummary(["email", "signal"])).toBe(true);
    expect(needsErrorSummary(["email", "signal", "telegram"])).toBe(true);
    expect(countFormFields(["email", "signal", "telegram"])).toBe(5);
  });
});

describe("buildConfigUpdate", () => {
  it("always enables, rounds and clamps the threshold, trims recipients and strips one leading '@'", () => {
    expect(
      buildConfigUpdate({
        services: ["email", "signal"],
        email: " me@example.com ",
        signalRecipient: " @@alice.42 ",
        telegramUsername: "",
        threshold: 2.345,
      }),
    ).toStrictEqual({
      enabled: true,
      services: ["email", "signal"],
      healthFactorThreshold: 2.35,
      email: "me@example.com",
      signalRecipient: "@alice.42",
      telegramUsername: undefined,
      channelLocales: { email: "en", signal: "en" },
    });
  });

  it("gives every selected channel a language: the one picked for it, else the page's", () => {
    const form = {
      services: ["email", "telegram"] as NotificationService[],
      email: "me@example.com",
      signalRecipient: "",
      telegramUsername: "alice_eth",
      threshold: 1.5,
      // Signal's pick is dropped with Signal itself, like its recipient.
      channelLocales: { telegram: "en", signal: "en" } as const,
    };
    expect(buildConfigUpdate(form, "cs").channelLocales).toStrictEqual({ email: "cs", telegram: "en" });
    expect(buildConfigUpdate({ ...form, channelLocales: {} }, "cs").channelLocales).toStrictEqual({
      email: "cs",
      telegram: "cs",
    });
    expect(buildConfigUpdate({ ...form, services: [] }, "cs").channelLocales).toStrictEqual({});
  });

  it("stores the Signal username without the 'u:' and '@' prefixes the server also strips", () => {
    const signal = (signalRecipient: string) =>
      buildConfigUpdate({ services: ["signal"], email: "", signalRecipient, telegramUsername: "", threshold: 1.5 })
        .signalRecipient;
    expect(signal(" u:@alice.42 ")).toBe("alice.42");
    expect(signal("ursula.42")).toBe("ursula.42");
  });

  it("stores the Telegram username as the server does: lowercased, without '@' or a t.me link", () => {
    const telegram = (telegramUsername: string) =>
      buildConfigUpdate({ services: ["telegram"], email: "", signalRecipient: "", telegramUsername, threshold: 1.5 })
        .telegramUsername;
    expect([" @Alice_Eth ", "https://t.me/Alice_Eth/", "telegram.me/alice_eth", "alice_eth"].map(telegram)).toEqual([
      "alice_eth",
      "alice_eth",
      "alice_eth",
      "alice_eth",
    ]);
  });

  it("keeps explicit undefined recipients for deselected services or blank input", () => {
    const update = buildConfigUpdate({
      services: ["telegram"],
      email: "me@example.com",
      signalRecipient: "alice.42",
      telegramUsername: "@alice_eth",
      threshold: 1.5,
    });
    expect(update).toStrictEqual({
      enabled: true,
      services: ["telegram"],
      healthFactorThreshold: 1.5,
      email: undefined,
      signalRecipient: undefined,
      telegramUsername: "alice_eth",
      channelLocales: { telegram: "en" },
    });
    expect(Object.keys(update)).toEqual([
      "enabled",
      "services",
      "healthFactorThreshold",
      "email",
      "signalRecipient",
      "telegramUsername",
      "channelLocales",
    ]);
    // A deselected Telegram clears the saved username, like a deselected Signal clears its recipient.
    const withoutTelegram = buildConfigUpdate({
      services: ["email"],
      email: "me@example.com",
      signalRecipient: "",
      telegramUsername: "alice_eth",
      threshold: 1.5,
    });
    expect(Object.keys(withoutTelegram)).toContain("telegramUsername");
    expect(withoutTelegram.telegramUsername).toBeUndefined();
    expect(
      buildConfigUpdate({
        services: ["email", "signal", "telegram"],
        email: "  ",
        signalRecipient: " @ ",
        telegramUsername: " @ ",
        threshold: 1.5,
      }),
    ).toMatchObject({
      email: undefined,
      signalRecipient: undefined,
      telegramUsername: undefined,
    });
  });

  it.each([1.0, 1.104, 1.105, 2.999, 3.5, 10.004, 10.006, 99])(
    "matches the reference payload for threshold %s",
    threshold => {
      for (const services of SERVICE_SETS)
        for (const email of EMAILS)
          for (const signalRecipient of SIGNALS)
            for (const telegramUsername of TELEGRAMS) {
              expect(
                buildConfigUpdate({ services, email, signalRecipient, telegramUsername, threshold }),
              ).toStrictEqual(referencePayload(services, email, signalRecipient, telegramUsername, threshold));
            }
    },
  );
});

describe("form errors in Czech", () => {
  const CS = ALERTS_MESSAGES.cs.formErrors;

  it("reports the same problems in the page's language", () => {
    const form = {
      services: ["email", "signal", "telegram"] as NotificationService[],
      email: "me@example",
      signalRecipient: "",
      telegramUsername: "",
    };
    expect(getNotificationFormErrors(form, "cs")).toStrictEqual({
      email: "Zadejte e-mailovou adresu ve tvaru jmeno@example.com.",
      signalRecipient: "Zadejte své uživatelské jméno v Signalu.",
      telegram: "Zadejte své uživatelské jméno na Telegramu.",
    });
    expect(validateNotificationForm({ ...form, services: [] }, "cs")).toBe("Vyberte alespoň jeden kanál upozornění.");
    expect(validateNotificationForm({ ...form, services: ["telegram"], telegramUsername: "alice-eth" }, "cs")).toBe(
      "Zadejte uživatelské jméno na Telegramu ve tvaru alice_eth: 4 až 32 písmen, číslic nebo podtržítek, na začátku písmeno a na konci ne _.",
    );
    // English stays the default for callers without a page (the API checks).
    expect(validateNotificationForm({ ...form, services: [] })).toBe(NOTIFICATION_FORM_ERRORS.noService);
  });

  it("has a Czech message for every English one, each a sentence without dashes", () => {
    const dashes = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
    expect(Object.keys(CS).sort()).toEqual(Object.keys(NOTIFICATION_FORM_ERRORS).sort());
    for (const message of Object.values(CS)) {
      expect(message).toMatch(/^\p{Lu}.+\.$/u);
      expect(message).not.toMatch(dashes);
    }
  });
});

describe("a Morpho alert's threshold range", () => {
  it("keeps a threshold below Aave's 1.1 minimum, within Morpho's", () => {
    const config = { ...CONFIG, healthFactorThreshold: 1.03 };
    expect(configToFormState(config).threshold).toBe(1.1);
    expect(configToFormState(config, MORPHO_THRESHOLD_RANGE)).toMatchObject({ threshold: 1.03, thresholdText: "1.03" });

    const form = { services: ["email" as const], email: "me@example.com", signalRecipient: "", telegramUsername: "" };
    expect(buildConfigUpdate({ ...form, threshold: 1.0 }, "en", MORPHO_THRESHOLD_RANGE).healthFactorThreshold).toBe(
      1.02,
    );
    expect(buildConfigUpdate({ ...form, threshold: 1.0 }).healthFactorThreshold).toBe(1.1);
  });
});

describe("alert copy for a market that is no network", () => {
  const cs = ALERTS_MESSAGES.cs;
  it("says na trhu and pro trh in Czech when the name is a market's, as for an Aave V4 Spoke", () => {
    const name = "Base (WETH/USDC)";
    expect(cs.emptyTitle(name, "market")).toBe("Na trhu Base (WETH/USDC) zatím nemáte žádné upozornění");
    expect(cs.thresholdDescription("1,05", name, "market")).toContain("health factor na trhu Base (WETH/USDC) klesne");
    expect(cs.deleteDescription(name, "market")).toContain("pro trh Base (WETH/USDC).");
    // Left out, an Aave label's own form: a V3 market is its network.
    expect(cs.emptyTitle("Base")).toBe("Na síti Base zatím nemáte žádné upozornění");
  });
});
