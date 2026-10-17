import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MarketSnapshot } from "~~/services/aave/getHealthFactor";
import { buildTestMessage, toTestPosition } from "~~/services/notifications/testMessage";

const NOW = new Date("2026-10-14T09:05:07.000Z");
const NOW_TEXT = "Oct 14, 2026, 9:05:07 AM Coordinated Universal Time";
const NOW_TEXT_CS = "14. 10. 2026 9:05:07, koordinovaný světový čas";
const DASHES = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);

/** A wallet with debt on Ethereum's Core market: health factor 1.4237, shown rounded down as 1.42. */
const snapshot = (overrides: Partial<MarketSnapshot> = {}): MarketSnapshot => ({
  chainName: "Ethereum (Core)",
  healthFactor: "1.42",
  healthFactorValue: 1.4237,
  collateralUSD: 12345.67,
  debtUSD: 6789.01,
  hasPosition: true,
  ...overrides,
});

const NO_DEBT = snapshot({ healthFactor: "∞", healthFactorValue: Infinity, collateralUSD: 987.654321, debtUSD: 0 });
const NO_POSITION = snapshot({
  healthFactor: "∞",
  healthFactorValue: Infinity,
  collateralUSD: 0,
  debtUSD: 0,
  hasPosition: false,
});

describe("toTestPosition", () => {
  it("is unknown when the position could not be read", () => {
    expect(toTestPosition(null, 1.5, "en")).toEqual({ kind: "unknown" });
  });

  it("is none when Aave counts no collateral and no debt in the market", () => {
    expect(toTestPosition(NO_POSITION, 1.5, "en")).toEqual({ kind: "none" });
  });

  it("is noDebt, with the collateral in USD, for an infinite health factor", () => {
    expect(toTestPosition(NO_DEBT, 1.5, "en")).toEqual({ kind: "noDebt", collateral: "$987.65" });
    expect(toTestPosition({ ...NO_DEBT, collateralUSD: 250_000 }, 1.5, "cs")).toEqual({
      kind: "noDebt",
      collateral: "$250.00K",
    });
  });

  it("describes a position with debt: the health factor as alerts show it, its zone, the amounts and the verdict", () => {
    expect(toTestPosition(snapshot(), 1.5, "en")).toEqual({
      kind: "debt",
      healthFactor: "1.42",
      status: "risky",
      collateral: "$12.35K",
      debt: "$6.79K",
      belowThreshold: true,
    });
  });

  it("writes the health factor with a decimal comma in Czech and keeps the app's USD format", () => {
    expect(toTestPosition(snapshot(), 1.5, "cs")).toMatchObject({
      healthFactor: "1,42",
      collateral: "$12.35K",
      debt: "$6.79K",
    });
  });

  it.each([
    [0.5, "critical"],
    [1.0999, "critical"],
    [1.1, "risky"],
    [1.4999, "risky"],
    [1.5, "safe"],
    [3.2, "safe"],
  ] as const)("puts a health factor of %d in the %s zone, as the dashboard's badge does", (value, status) => {
    expect(toTestPosition(snapshot({ healthFactorValue: value }), 1.2, "en")).toMatchObject({ status });
  });

  it("compares the exact value with the threshold, as the cron does, not the rounded text", () => {
    // Shown as 1.49 and below 1.5.
    expect(toTestPosition(snapshot({ healthFactor: "1.49", healthFactorValue: 1.4996 }), 1.5, "en")).toMatchObject({
      belowThreshold: true,
    });
    // At the threshold is not below it.
    expect(toTestPosition(snapshot({ healthFactor: "1.50", healthFactorValue: 1.5 }), 1.5, "en")).toMatchObject({
      belowThreshold: false,
    });
    // Shown as 1.80, a hair above the threshold.
    expect(toTestPosition(snapshot({ healthFactor: "1.80", healthFactorValue: 1.80001 }), 1.8, "en")).toMatchObject({
      belowThreshold: false,
    });
    expect(toTestPosition(snapshot({ healthFactor: "1.79", healthFactorValue: 1.79999 }), 1.8, "en")).toMatchObject({
      belowThreshold: true,
    });
  });
});

describe("buildTestMessage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const build = (input: Partial<Parameters<typeof buildTestMessage>[0]> = {}) =>
    buildTestMessage({ chainName: "Ethereum (Core)", snapshot: snapshot(), threshold: 1.5, locale: "en", ...input });

  it("writes a position below the threshold in five lines: the first and the last set apart by a blank line", () => {
    const { text, subject, html } = build();
    expect(text.split("\n")).toEqual([
      "Test message from Tokenping: alerts on this channel work.",
      "",
      "Your alert: Ethereum (Core), when the health factor drops below 1.5.",
      "Right now: health factor 1.42 (Risky), collateral $12.35K, debt $6.79K.",
      "That is below your threshold, so the next check sends a real alert.",
      "",
      `Checked every 5 minutes. Sent at: ${NOW_TEXT}`,
    ]);
    expect(subject).toBe("Tokenping test message - Ethereum (Core)");
    expect(html).toBe(
      "<p><strong>Test message from Tokenping: alerts on this channel work.</strong></p>" +
        "<p>Your alert: Ethereum (Core), when the health factor drops below 1.5.</p>" +
        "<p>Right now: health factor 1.42 (Risky), collateral $12.35K, debt $6.79K.</p>" +
        "<p>That is below your threshold, so the next check sends a real alert.</p>" +
        `<p><small>Checked every 5 minutes. Sent at: ${NOW_TEXT}</small></p>`,
    );
  });

  it("says no alert would be sent for a position above the threshold, and names each zone", () => {
    expect(build({ snapshot: snapshot({ healthFactor: "2.31", healthFactorValue: 2.3125 }) }).text).toContain(
      "Right now: health factor 2.31 (Safe), collateral $12.35K, debt $6.79K.\n" +
        "That is above your threshold, so no alert would be sent now.\n",
    );
    expect(
      build({ snapshot: snapshot({ healthFactor: "1.05", healthFactorValue: 1.05 }), threshold: 1.2 }).text,
    ).toContain("health factor 1.05 (Critical)");
  });

  it.each([
    ["no debt", NO_DEBT, "Ethereum (Core)", "Right now: no debt, so nothing can be liquidated (collateral $987.65)."],
    ["no position", NO_POSITION, "Ethereum (Core)", "Right now: no open position in this market."],
    [
      "a position that could not be read",
      null,
      "Ethereum (V4 Lido)",
      "Right now: your position could not be read. Real alerts try again at every check.",
    ],
  ])("writes %s in four lines, without a verdict", (_, position, chainName, nowLine) => {
    const { text, html } = build({ chainName: "Ethereum (V4 Lido)", snapshot: position });
    expect(text.split("\n")).toEqual([
      "Test message from Tokenping: alerts on this channel work.",
      "",
      `Your alert: ${chainName}, when the health factor drops below 1.5.`,
      nowLine,
      "",
      `Checked every 5 minutes. Sent at: ${NOW_TEXT}`,
    ]);
    expect(html.match(/<p>/g)).toHaveLength(4);
    expect(html).not.toContain("threshold, so");
  });

  it("names the market from the snapshot, and from chainName only when the read failed", () => {
    expect(build({ chainName: "chain 1", snapshot: snapshot({ chainName: "Ethereum (V4 Lido)" }) }).subject).toBe(
      "Tokenping test message - Ethereum (V4 Lido)",
    );
    expect(build({ chainName: "chain 999", snapshot: null }).subject).toBe("Tokenping test message - chain 999");
  });

  it("writes the threshold as saved, without padding", () => {
    expect(build({ threshold: 1.85 }).text).toContain("drops below 1.85.");
    expect(build({ threshold: 2 }).text).toContain("drops below 2.");
  });

  it("stamps the time it is given, or now", () => {
    expect(build({ now: new Date("2026-12-31T23:59:59Z") }).text).toMatch(
      /Sent at: Dec 31, 2026, 11:59:59 PM Coordinated Universal Time$/,
    );
    expect(build().text).toMatch(new RegExp(`Sent at: ${NOW_TEXT}$`));
  });

  it("escapes &, < and > in the html, and only there", () => {
    const { text, subject, html } = build({ snapshot: snapshot({ chainName: "R&D <Spoke> > 1" }) });
    expect(html).toContain("<p>Your alert: R&amp;D &lt;Spoke&gt; &gt; 1, when the health factor drops below 1.5.</p>");
    expect(html).not.toContain("<Spoke>");
    expect(text).toContain("Your alert: R&D <Spoke> > 1, when");
    expect(subject).toBe("Tokenping test message - R&D <Spoke> > 1");
  });

  it("writes every line in Czech, with decimal commas, the Czech zone and the plural of minutes", () => {
    const { text, subject, html } = build({ locale: "cs", threshold: 1.5 });
    expect(text.split("\n")).toEqual([
      "Testovací zpráva od Tokenpingu: upozornění přes tento kanál fungují.",
      "",
      "Vaše upozornění: Ethereum (Core), když health factor klesne pod 1,5.",
      "Teď: health factor 1,42 (rizikový), kolaterál $12.35K, dluh $6.79K.",
      "To je pod vaším prahem, takže příští kontrola pošle skutečné upozornění.",
      "",
      `Kontrola každých 5 minut. Odesláno: ${NOW_TEXT_CS}`,
    ]);
    expect(subject).toBe("Testovací zpráva Tokenpingu - Ethereum (Core)");
    expect(html).toContain(
      "<p><strong>Testovací zpráva od Tokenpingu: upozornění přes tento kanál fungují.</strong></p>",
    );
    expect(html).toContain(`<p><small>Kontrola každých 5 minut. Odesláno: ${NOW_TEXT_CS}</small></p>`);
  });

  it("writes the other zones, the verdict above the threshold and every other position in Czech", () => {
    const cs = (position: MarketSnapshot | null, threshold = 1.5) =>
      build({ locale: "cs", snapshot: position, threshold }).text;
    expect(cs(snapshot({ healthFactor: "1.05", healthFactorValue: 1.05 }), 1.2)).toContain(
      "Teď: health factor 1,05 (kritický)",
    );
    expect(cs(snapshot({ healthFactor: "2.50", healthFactorValue: 2.5 }), 1.85)).toContain(
      "pod 1,85.\nTeď: health factor 2,50 (bezpečný), kolaterál $12.35K, dluh $6.79K.\n" +
        "To je nad vaším prahem, takže teď by žádné upozornění neodešlo.\n",
    );
    expect(cs(NO_DEBT)).toContain("\nTeď: bez dluhu, takže nic nemůže být zlikvidováno (kolaterál $987.65).\n");
    expect(cs(NO_POSITION)).toContain("\nTeď: na tomto trhu nemáte otevřenou pozici.\n");
    expect(cs(null)).toContain(
      "\nTeď se vaši pozici nepodařilo načíst. Skutečná upozornění to zkoušejí při každé kontrole znovu.\n",
    );
  });

  it("uses no dashes in any language or state", () => {
    for (const locale of ["en", "cs"] as const) {
      for (const position of [snapshot(), NO_DEBT, NO_POSITION, null]) {
        const { text, subject, html } = build({ locale, snapshot: position });
        expect(`${text}${subject}${html}`).not.toMatch(DASHES);
      }
    }
  });
});
