import { describe, expect, it } from "vitest";
import { PaymentStatus, PaymentSteps } from "~~/components/custom/aave/PaymentLifecycle";
import type { PaymentProgress } from "~~/components/custom/aave/paymentProgress";
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
