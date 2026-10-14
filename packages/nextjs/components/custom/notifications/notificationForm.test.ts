import { describe, expect, it } from "vitest";
import {
  EMPTY_FORM_STATE,
  buildConfigUpdate,
  canSubmitNotificationForm,
  configToFormState,
  configToFormStateOnCancel,
  toggleService,
  validateNotificationForm,
} from "~~/components/custom/notifications/notificationForm";
import type { NotificationConfig, NotificationService } from "~~/types/notifications";

/*
 * Verbatim logic from the pre-refactor NotificationConfig.tsx (handleStore, the Save button's `disabled`
 * expression and saveConfig), used as oracles over an input matrix in addition to the explicit examples.
 */
const DEFAULT_HEALTH_FACTOR_THRESHOLD = 1.5;
const legacyClampThreshold = (value: number) => Math.min(10, Math.max(1.1, value));

const legacyValidate = (
  services: NotificationService[],
  email: string,
  signalRecipient: string,
  telegramChatId: string | undefined,
) => {
  const currentServices = services ?? [];
  if (currentServices.length === 0) return "Please select at least one notification service";
  if (currentServices.includes("email")) {
    const trimmed = (email ?? "").trim();
    if (!trimmed) return "Please enter your email address";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return "Please enter a valid email address";
  }
  if (currentServices.includes("signal")) {
    const trimmed = (signalRecipient ?? "").trim().replace(/^@/, "");
    if (!trimmed) return "Please enter your Signal username";
    const usernameRegex = /^[a-zA-Z0-9][a-zA-Z0-9_]{0,29}\.\d{2,}$/;
    if (!usernameRegex.test(trimmed)) {
      return "Invalid Signal username. Expected format: alice.42 (find yours in Signal → Settings → Profile)";
    }
  }
  if (currentServices.includes("telegram")) {
    if (!telegramChatId) return "Please connect Telegram first using the 'Connect Telegram' button.";
  }
  return null;
};

const legacySaveDisabled = (
  services: NotificationService[],
  email: string,
  signalRecipient: string,
  telegramChatId: string | undefined,
) =>
  (services ?? []).length === 0 ||
  ((services ?? []).includes("email") && !(email ?? "").trim()) ||
  ((services ?? []).includes("signal") && !(signalRecipient ?? "").trim()) ||
  ((services ?? []).includes("telegram") && !telegramChatId);

const legacyPayload = (services: NotificationService[], email: string, signalRecipient: string, threshold: number) => {
  const currentServices = services ?? [];
  const roundedThreshold = Math.round((threshold ?? DEFAULT_HEALTH_FACTOR_THRESHOLD) * 100) / 100;
  return {
    enabled: true,
    services: currentServices,
    healthFactorThreshold: legacyClampThreshold(roundedThreshold),
    email: currentServices.includes("email") ? (email ?? "").trim() || undefined : undefined,
    signalRecipient: currentServices.includes("signal")
      ? (signalRecipient ?? "").trim().replace(/^@/, "") || undefined
      : undefined,
  };
};

const SERVICE_SETS: NotificationService[][] = [
  [],
  ["email"],
  ["signal"],
  ["telegram"],
  ["email", "signal"],
  ["signal", "email", "telegram"],
];
const EMAILS = ["", "   ", "me@example.com", "  me@example.com  ", "me@example", "a b@c.de", "@x.io"];
const SIGNALS = ["", " ", "@", "@@alice.42", "alice.42", " @alice.42 ", "u:alice.42", "_alice.42", "alice.4", "alice"];
const CHAT_IDS = [undefined, "", "123"];

const CONFIG: NotificationConfig = {
  chainId: 42161,
  enabled: true,
  services: ["email", "signal", "telegram"],
  healthFactorThreshold: 1.8,
  email: "me@example.com",
  signalRecipient: "alice.42",
  telegramChatId: "555",
  telegramUsername: "bob",
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
  it("copies a saved config, without the Telegram fields", () => {
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

describe("configToFormStateOnCancel", () => {
  it("returns the empty state without a config", () => {
    expect(configToFormStateOnCancel(null)).toBe(EMPTY_FORM_STATE);
  });

  it("copies a saved config like configToFormState", () => {
    expect(configToFormStateOnCancel(CONFIG)).toStrictEqual(configToFormState(CONFIG));
  });

  // BUG(B0.8): Cancel does not filter services or apply the email fallback, and keeps `enabled` as is.
  it("keeps raw services and enabled", () => {
    const legacy = { ...CONFIG, services: [] };
    expect(configToFormStateOnCancel(legacy).services).toEqual([]);
    expect(configToFormState(legacy).services).toEqual(["email"]);
    const unknown = { ...CONFIG, services: ["sms"] as unknown as NotificationService[] };
    expect(configToFormStateOnCancel(unknown).services).toEqual(["sms"]);
    const missingEnabled = { ...CONFIG, enabled: undefined } as unknown as NotificationConfig;
    expect(configToFormStateOnCancel(missingEnabled).enabled).toBeUndefined();
    expect(configToFormState(missingEnabled).enabled).toBe(false);
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
    [{}, "Please select at least one notification service"],
    [{ services: ["email"], email: "  " }, "Please enter your email address"],
    [{ services: ["email"], email: "me@example" }, "Please enter a valid email address"],
    [{ services: ["signal"], signalRecipient: " @ " }, "Please enter your Signal username"],
    [
      { services: ["signal"], signalRecipient: "u:alice.42" },
      "Invalid Signal username. Expected format: alice.42 (find yours in Signal → Settings → Profile)",
    ],
    [
      { services: ["telegram"], telegramChatId: "" },
      "Please connect Telegram first using the 'Connect Telegram' button.",
    ],
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
    ).toBe("Please enter your email address");
  });

  it("matches the legacy handleStore checks for every combination", () => {
    for (const services of SERVICE_SETS)
      for (const email of EMAILS)
        for (const signalRecipient of SIGNALS)
          for (const telegramChatId of CHAT_IDS) {
            expect(validateNotificationForm({ services, email, signalRecipient, telegramChatId })).toBe(
              legacyValidate(services, email, signalRecipient, telegramChatId),
            );
          }
  });
});

describe("canSubmitNotificationForm", () => {
  it("only checks presence: a lone '@' Signal handle or an invalid email still enables Save", () => {
    expect(
      canSubmitNotificationForm({ services: ["signal"], email: "", signalRecipient: "@", telegramChatId: undefined }),
    ).toBe(true);
    expect(
      canSubmitNotificationForm({ services: ["email"], email: "nope", signalRecipient: "", telegramChatId: undefined }),
    ).toBe(true);
    expect(canSubmitNotificationForm({ services: [], email: "a@b.co", signalRecipient: "", telegramChatId: "1" })).toBe(
      false,
    );
    expect(
      canSubmitNotificationForm({ services: ["telegram"], email: "", signalRecipient: "", telegramChatId: "" }),
    ).toBe(false);
  });

  it("is the negation of the legacy Save `disabled` expression (without isSaving) for every combination", () => {
    for (const services of SERVICE_SETS)
      for (const email of EMAILS)
        for (const signalRecipient of SIGNALS)
          for (const telegramChatId of CHAT_IDS) {
            expect(canSubmitNotificationForm({ services, email, signalRecipient, telegramChatId })).toBe(
              !legacySaveDisabled(services, email, signalRecipient, telegramChatId),
            );
          }
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
    "matches the legacy payload for threshold %s",
    threshold => {
      for (const services of SERVICE_SETS)
        for (const email of EMAILS)
          for (const signalRecipient of SIGNALS) {
            expect(buildConfigUpdate({ services, email, signalRecipient, threshold })).toStrictEqual(
              legacyPayload(services, email, signalRecipient, threshold),
            );
          }
    },
  );
});
