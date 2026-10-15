import { describe, expect, it } from "vitest";
import {
  EMPTY_FORM_STATE,
  NOTIFICATION_FORM_ERRORS,
  buildConfigUpdate,
  configToFormState,
  countFormFields,
  getNotificationFormErrors,
  needsErrorSummary,
  toggleService,
  validateNotificationForm,
} from "~~/components/custom/notifications/notificationForm";
import type { NotificationConfig, NotificationService } from "~~/types/notifications";

/*
 * Reference versions of the original NotificationConfig.tsx logic (handleStore and saveConfig), written out with
 * literal regexes and limits and compared with the module over an input matrix. They check the order of the checks,
 * the presence rules and the payload shape. They carry the deliberate changes: the Signal prefix rule (B0.11: an
 * optional "u:" then an optional "@", as on the server), as a copy of that rule, so the explicit Signal cases in
 * validateNotificationForm and buildConfigUpdate are what pin it; and the messages, rewritten to say how to fix the
 * field now that they show under it.
 */
const referenceNormalizeSignal = (raw: string) => raw.trim().replace(/^(?:u:)?@?/, "");
const referenceClampThreshold = (value: number) => Math.min(10, Math.max(1.1, value));

const referenceValidate = (
  services: NotificationService[],
  email: string,
  signalRecipient: string,
  telegramChatId: string | undefined,
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
  if (services.includes("telegram") && !telegramChatId) {
    return "Connect Telegram before you save.";
  }
  return null;
};

const referencePayload = (
  services: NotificationService[],
  email: string,
  signalRecipient: string,
  threshold: number,
) => ({
  enabled: true,
  services,
  healthFactorThreshold: referenceClampThreshold(Math.round(threshold * 100) / 100),
  email: services.includes("email") ? email.trim() || undefined : undefined,
  signalRecipient: services.includes("signal") ? referenceNormalizeSignal(signalRecipient) || undefined : undefined,
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
const CHAT_IDS = [undefined, "", "123"];

const CONFIG: NotificationConfig = {
  chainId: 42161,
  enabled: true,
  services: ["email", "signal", "telegram"],
  healthFactorThreshold: 1.8,
  email: "me@example.com",
  signalRecipient: "alice.42",
};

describe("EMPTY_FORM_STATE", () => {
  it("is the reset state: nothing selected and the default 1.50 threshold", () => {
    expect(EMPTY_FORM_STATE).toStrictEqual({
      enabled: false,
      services: [],
      email: "",
      signalRecipient: "",
      threshold: 1.5,
      thresholdText: "1.50",
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
      threshold: 1.8,
      thresholdText: "1.80",
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

describe("toggleService", () => {
  it("appends a missing service and removes a selected one, without mutating the input", () => {
    const services: NotificationService[] = ["signal"];
    expect(toggleService(services, "email")).toEqual(["signal", "email"]);
    expect(toggleService(["email", "signal", "telegram"], "signal")).toEqual(["email", "telegram"]);
    expect(services).toEqual(["signal"]);
  });
});

describe("validateNotificationForm", () => {
  const form = { services: [] as NotificationService[], email: "", signalRecipient: "", telegramChatId: undefined };

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
    [{ services: ["telegram"], telegramChatId: "" }, NOTIFICATION_FORM_ERRORS.telegramNotLinked],
    [
      {
        services: ["email", "signal", "telegram"],
        email: " me@example.com ",
        signalRecipient: " @alice.42 ",
        telegramChatId: "1",
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
        telegramChatId: undefined,
      }),
    ).toBe(NOTIFICATION_FORM_ERRORS.noEmail);
  });

  it("says the Telegram link could not be checked, instead of asking to connect, while its status is unknown", () => {
    const unknown = { ...form, services: ["telegram"] as NotificationService[], telegramStatusUnknown: true };
    expect(validateNotificationForm(unknown)).toBe("Select Try again to check your Telegram link, then save.");
    // Earlier fields still come first, and a form without Telegram does not depend on the link.
    expect(validateNotificationForm({ ...unknown, services: ["email", "telegram"] })).toBe(
      NOTIFICATION_FORM_ERRORS.noEmail,
    );
    expect(validateNotificationForm({ ...unknown, services: ["email"], email: "me@example.com" })).toBeNull();
  });

  it("matches the reference checks for every combination", () => {
    for (const services of SERVICE_SETS)
      for (const email of EMAILS)
        for (const signalRecipient of SIGNALS)
          for (const telegramChatId of CHAT_IDS) {
            expect(validateNotificationForm({ services, email, signalRecipient, telegramChatId })).toBe(
              referenceValidate(services, email, signalRecipient, telegramChatId),
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
        telegramChatId: undefined,
      }),
    ).toStrictEqual({
      email: NOTIFICATION_FORM_ERRORS.invalidEmail,
      signalRecipient: NOTIFICATION_FORM_ERRORS.noSignal,
      telegram: NOTIFICATION_FORM_ERRORS.telegramNotLinked,
    });
  });

  it("asks only for a service when none is selected, and is empty for a valid form", () => {
    expect(getNotificationFormErrors({ services: [], email: "", signalRecipient: "" })).toStrictEqual({
      services: NOTIFICATION_FORM_ERRORS.noService,
    });
    expect(
      getNotificationFormErrors({
        services: ["email", "telegram"],
        email: "me@example.com",
        signalRecipient: "",
        telegramChatId: "1",
      }),
    ).toStrictEqual({});
  });

  it("writes every message as a sentence that says what to do, without dashes", () => {
    // En and em dash, built from their code points so this file does not contain them, even as escapes.
    const dashes = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
    for (const message of Object.values(NOTIFICATION_FORM_ERRORS)) {
      expect(message).toMatch(/^(?:Select|Enter|Connect) .+\.$/);
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
        threshold: 2.345,
      }),
    ).toStrictEqual({
      enabled: true,
      services: ["email", "signal"],
      healthFactorThreshold: 2.35,
      email: "me@example.com",
      signalRecipient: "@alice.42",
    });
  });

  it("stores the Signal username without the 'u:' and '@' prefixes the server also strips", () => {
    expect(
      buildConfigUpdate({ services: ["signal"], email: "", signalRecipient: " u:@alice.42 ", threshold: 1.5 })
        .signalRecipient,
    ).toBe("alice.42");
    expect(
      buildConfigUpdate({ services: ["signal"], email: "", signalRecipient: "ursula.42", threshold: 1.5 })
        .signalRecipient,
    ).toBe("ursula.42");
  });

  it("keeps explicit undefined recipients for deselected services or blank input", () => {
    const update = buildConfigUpdate({
      services: ["telegram"],
      email: "me@example.com",
      signalRecipient: "alice.42",
      threshold: 1.5,
    });
    expect(update).toStrictEqual({
      enabled: true,
      services: ["telegram"],
      healthFactorThreshold: 1.5,
      email: undefined,
      signalRecipient: undefined,
    });
    expect(Object.keys(update)).toEqual(["enabled", "services", "healthFactorThreshold", "email", "signalRecipient"]);
    expect(
      buildConfigUpdate({ services: ["email", "signal"], email: "  ", signalRecipient: " @ ", threshold: 1.5 }),
    ).toMatchObject({
      email: undefined,
      signalRecipient: undefined,
    });
  });

  it.each([1.0, 1.104, 1.105, 2.999, 3.5, 10.004, 10.006, 99])(
    "matches the reference payload for threshold %s",
    threshold => {
      for (const services of SERVICE_SETS)
        for (const email of EMAILS)
          for (const signalRecipient of SIGNALS) {
            expect(buildConfigUpdate({ services, email, signalRecipient, threshold })).toStrictEqual(
              referencePayload(services, email, signalRecipient, threshold),
            );
          }
    },
  );
});
