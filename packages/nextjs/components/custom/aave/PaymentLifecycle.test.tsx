import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { PaymentStatus, PaymentSteps } from "~~/components/custom/aave/PaymentLifecycle";
import type { PaymentProgress } from "~~/components/custom/aave/paymentProgress";
import { LocaleProvider } from "~~/i18n/LocaleProvider";
import { renderMarkup } from "~~/utils/testing/render";

const EXPLORER = { name: "Arbiscan", url: "https://arbiscan.io" };

const status = (props: Partial<Parameters<typeof PaymentStatus>[0]>) =>
  renderMarkup(
    <PaymentStatus
      amount="1.5 USDC"
      progress={null}
      pendingAccessMessage={null}
      network="Arbitrum One"
      explorer={EXPLORER}
      {...props}
    />,
  );

describe("PaymentStatus", () => {
  it("stays mounted and empty while nothing runs, so the first change is announced", () => {
    expect(status({})).toBe('<div role="status" aria-live="polite" aria-atomic="true">\n</div>');
  });

  it("confirms a payment whose access does not show yet in the success tone, with an icon", () => {
    const html = status({ pendingAccessMessage: "Payment confirmed. Access will appear shortly." });

    expect(html).toContain("border-success/30 bg-success-subtle");
    expect(html).toContain("lucide-circle-check");
    expect(html).toContain(">Payment confirmed. Access will appear shortly.</p>");
  });

  it("goes quiet for a rejected or failed request instead of calling it submitted", () => {
    const html = status({ progress: { step: "failed", approveSkipped: false } });

    expect(html).toBe('<div role="status" aria-live="polite" aria-atomic="true" data-step="failed">\n</div>');
  });

  it("gives an explorer link a 44px touch height on coarse pointers", () => {
    const html = status({ progress: { step: "pay-pending", payHash: "0xpay", approveSkipped: true } });

    expect(html).toMatch(/<a href="https:\/\/arbiscan.io\/tx\/0xpay"[^>]*class="[^"]*pointer-coarse:min-h-11/);
  });

  it("shows the hash without a guessed link when the network has no explorer", () => {
    const html = status({
      progress: { step: "pay-pending", payHash: "0xpay", approveSkipped: true },
      explorer: undefined,
    });

    expect(html).toContain(">Processing on Arbitrum One</p>");
    expect(html).toContain("0xpay");
    expect(html).not.toContain("<a ");
  });
});

describe("PaymentSteps", () => {
  it("numbers both steps before the flow starts", () => {
    const html = renderMarkup(<PaymentSteps amount="1.5 USDC" progress={null} />);

    expect(html).not.toContain('aria-current="step"');
    expect(html).toContain(">1</span>");
    expect(html).toContain(">2</span>");
    expect(html).toMatchSnapshot();
  });

  // The marker's tint and icon used to carry the state alone, with the word only for screen readers.
  it.each<[string, PaymentProgress, string | null, string | null]>([
    ["signing the approval", { step: "approve-sign", approveSkipped: false }, "In progress", null],
    ["signing the payment", { step: "pay-sign", approveHash: "0xa", approveSkipped: false }, "Done", "In progress"],
    ["paying without an approval", { step: "pay-pending", approveSkipped: true }, "Not needed", "In progress"],
    ["after a failed payment", { step: "failed", approveHash: "0xa", approveSkipped: false }, "Done", null],
    ["after a rejected approval", { step: "failed", approveSkipped: false }, null, null],
  ])("names each step's state in visible words %s", (_label, progress, approveWord, payWord) => {
    const html = renderMarkup(<PaymentSteps amount="1.5 USDC" progress={progress} />);
    const words = [...html.matchAll(/<span class="sr-only">, <\/span>([^<]+)<\/span>/g)].map(([, word]) => word);

    expect(words).toEqual([approveWord, payWord].filter(word => word !== null));
    if (approveWord === null) expect(html).toContain(">1</span>");
  });
});

describe("payment lifecycle in Czech", () => {
  const czech = (node: ReactNode) => renderMarkup(<LocaleProvider locale="cs">{node}</LocaleProvider>);
  const czechStatus = (progress: PaymentProgress, network: string | null = "Arbitrum One") =>
    czech(
      <PaymentStatus
        amount="1.5 USDC"
        progress={progress}
        pendingAccessMessage={null}
        network={network ?? undefined}
        explorer={EXPLORER}
      />,
    );

  it("names both steps and their states in Czech", () => {
    const html = czech(
      <PaymentSteps amount="1.5 USDC" progress={{ step: "pay-sign", approveHash: "0xa", approveSkipped: false }} />,
    );

    expect(html).toContain('aria-label="Kroky platby"');
    expect(html).toContain(">Schválit 1.5 USDC</span>");
    expect(html).toContain(">Zaplatit 1.5 USDC</span>");
    expect(html).toContain("Hotovo");
    expect(html).toContain("Probíhá");
    expect(html).toContain("Odešle platbu a odemkne upozornění.");
    expect(html).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
  });

  it("calls a skipped approval not needed", () => {
    const html = czech(<PaymentSteps amount="1.5 USDC" progress={{ step: "pay-pending", approveSkipped: true }} />);

    expect(html).toContain("Není potřeba");
  });

  it.each<[PaymentProgress, string, string]>([
    [{ step: "preparing", approveSkipped: false }, "Připravujeme platbu", "Ověřujeme aktuální cenu a vaše schválení."],
    [
      { step: "approve-sign", approveSkipped: false },
      "Potvrďte v peněžence",
      "Krok 1 ze 2: schválení 1.5 USDC. Dokud nepotvrdíte, nic se neodešle.",
    ],
    [
      { step: "approve-pending", approveHash: "0xapprove", approveSkipped: false },
      "Zpracování na síti Arbitrum One",
      "Krok 1 ze 2: schválení odesláno. Peněženka vás pak požádá o potvrzení platby.",
    ],
    [
      { step: "pay-sign", approveSkipped: true },
      "Potvrďte v peněžence",
      "Krok 2 ze 2: platba 1.5 USDC. Dokud nepotvrdíte, nic se neodešle.",
    ],
    [
      { step: "pay-pending", payHash: "0xpay", approveSkipped: true },
      "Zpracování na síti Arbitrum One",
      "Krok 2 ze 2: platba odeslána. Upozornění se odemknou, jakmile ji síť potvrdí.",
    ],
  ])("describes the %o step in Czech", (progress, title, body) => {
    const html = czechStatus(progress);

    expect(html).toContain(`>${title}</p>`);
    expect(html).toContain(`>${body}</p>`);
  });

  it("links the transaction in Czech", () => {
    const html = czechStatus({ step: "pay-pending", payHash: "0xpay", approveSkipped: true });

    expect(html).toContain('<span class="sr-only">Transakce </span>');
    expect(html).toContain("Zobrazit na Arbiscan");
    expect(html).toContain("(otevře se v nové záložce)");
  });

  it("says the network without a name when the payment network is unknown", () => {
    expect(czechStatus({ step: "pay-pending", payHash: "0xpay", approveSkipped: true }, null)).toContain(
      ">Zpracování v síti</p>",
    );
  });
});
