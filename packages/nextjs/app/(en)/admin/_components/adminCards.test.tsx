// @vitest-environment jsdom
import type { ReactElement } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ADDRESS_ERROR } from "~~/app/(en)/admin/_components/AddressField";
import type { TxPhase } from "~~/app/(en)/admin/_components/AdminCard";
import { MaxDurationCard } from "~~/app/(en)/admin/_components/MaxDurationCard";
import { PauseCard } from "~~/app/(en)/admin/_components/PauseCard";
import { PlanCard } from "~~/app/(en)/admin/_components/PlanCard";
import { TransferOwnershipCard } from "~~/app/(en)/admin/_components/TransferOwnershipCard";
import { WithdrawNativeCard } from "~~/app/(en)/admin/_components/WithdrawNativeCard";
import { WithdrawTokenCard } from "~~/app/(en)/admin/_components/WithdrawTokenCard";
import type { AdminTxError } from "~~/app/(en)/admin/_components/adminTxError";

// jsdom has no modal dialogs: open and close by the attribute, and fire close like a browser does.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

const CHECKSUMMED = "0x79872d7529cfE1c062838fACDA004Ce4BFB16553";

const input = (label: string) => screen.getByLabelText(label) as HTMLInputElement;

const type = (label: string, value: string) => fireEvent.change(input(label), { target: { value } });

const clickButton = (label: string) => fireEvent.click(screen.getByRole("button", { name: label }));

/** The error message element a control's aria-describedby points to, if any. */
const describedError = (control: HTMLElement) =>
  (control.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .map(id => document.getElementById(id))
    .find(element => element?.getAttribute("role") === "alert");

const transferCard = (props: Partial<Parameters<typeof TransferOwnershipCard>[0]> = {}) => (
  <TransferOwnershipCard
    value=""
    onChange={vi.fn()}
    isBusy={false}
    onReview={vi.fn()}
    onConfirm={vi.fn()}
    onCancelConfirm={vi.fn()}
    {...props}
  />
);

describe("PlanCard", () => {
  const form = { tokenAddress: "token-value", price: "price-value", durationSeconds: "duration-value", enabled: false };
  const renderCard = ({ onChange = vi.fn(), onSubmit = vi.fn(), decimalsKnown = true } = {}) =>
    render(
      <PlanCard
        form={form}
        onChange={onChange}
        tokenDecimals={decimalsKnown ? 6 : undefined}
        isDecimalsLoading={false}
        tokenSymbol="USDC"
        currentPlan={undefined}
        isBusy={false}
        onSubmit={onSubmit}
      />,
    );

  it.each([
    ["Token address", "tokenAddress"],
    ["Price (USDC)", "price"],
    ["Duration (seconds)", "durationSeconds"],
  ] as const)("the %j input shows and patches form.%s", (label, field) => {
    const onChange = vi.fn();
    renderCard({ onChange });
    expect(input(label).value).toBe(form[field]);
    type(label, "typed");
    expect(onChange.mock.calls).toEqual([[{ [field]: "typed" }]]);
  });

  it("the checkbox shows and patches form.enabled", () => {
    const onChange = vi.fn();
    renderCard({ onChange });
    expect(input("Plan enabled").checked).toBe(false);
    fireEvent.click(input("Plan enabled"));
    expect(onChange.mock.calls).toEqual([[{ enabled: true }]]);
  });

  it("submits from Save plan", () => {
    const onSubmit = vi.fn();
    renderCard({ onSubmit });
    clickButton("Save plan");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not submit while the token decimals are unknown", () => {
    const onSubmit = vi.fn();
    renderCard({ onSubmit, decimalsKnown: false });
    clickButton("Save plan");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("groups the current price and shows the duration in seconds and days", () => {
    render(
      <PlanCard
        form={form}
        onChange={vi.fn()}
        tokenDecimals={6}
        isDecimalsLoading={false}
        tokenSymbol="USDC"
        currentPlan={[1_234_500_000n, 2_592_000n, true]}
        isBusy={false}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText("1,234.5 USDC")).toBeDefined();
    expect(screen.getByText("2,592,000 seconds (30 days)")).toBeDefined();
  });
});

describe("WithdrawNativeCard", () => {
  const form = { to: "to-value", amountEth: "amount-value" };
  const renderCard = (onChange = vi.fn(), onSubmit = vi.fn(), balance?: bigint) =>
    render(<WithdrawNativeCard form={form} onChange={onChange} balance={balance} isBusy={false} onSubmit={onSubmit} />);

  it.each([
    ["Destination address", "to"],
    ["Amount (ETH)", "amountEth"],
  ] as const)("the %j input shows and patches form.%s", (label, field) => {
    const onChange = vi.fn();
    renderCard(onChange);
    expect(input(label).value).toBe(form[field]);
    type(label, "typed");
    expect(onChange.mock.calls).toEqual([[{ [field]: "typed" }]]);
  });

  it("takes the amount in a plain brand Input in the data font", () => {
    renderCard();
    const amount = input("Amount (ETH)");
    expect(amount.getAttribute("data-slot")).toBe("input");
    expect(amount.getAttribute("inputmode")).toBe("decimal");
    expect(amount.className.split(" ")).toEqual(expect.arrayContaining(["input", "border-input", "font-data"]));
  });

  it("submits from Withdraw ETH", () => {
    const onSubmit = vi.fn();
    renderCard(vi.fn(), onSubmit);
    clickButton("Withdraw ETH");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows every wei of the balance, with the whole part grouped", () => {
    renderCard(vi.fn(), vi.fn(), 1_234_500_000_000_000_001_000n);
    expect(screen.getByText("1,234.500000000000001 ETH")).toBeDefined();
  });
});

describe("WithdrawTokenCard", () => {
  const form = { tokenAddress: "token-value", to: "to-value", amount: "amount-value" };
  const renderCard = ({ onChange = vi.fn(), onSubmit = vi.fn(), decimalsKnown = true } = {}) =>
    render(
      <WithdrawTokenCard
        form={form}
        onChange={onChange}
        balance={12_345_678_900n}
        tokenDecimals={decimalsKnown ? 6 : undefined}
        isDecimalsLoading={false}
        tokenSymbol="USDC"
        isBusy={false}
        onSubmit={onSubmit}
      />,
    );

  it.each([
    ["Token address", "tokenAddress"],
    ["Destination address", "to"],
    ["Amount (USDC)", "amount"],
  ] as const)("the %j input shows and patches form.%s", (label, field) => {
    const onChange = vi.fn();
    renderCard({ onChange });
    expect(input(label).value).toBe(form[field]);
    type(label, "typed");
    expect(onChange.mock.calls).toEqual([[{ [field]: "typed" }]]);
  });

  it("submits from Withdraw token", () => {
    const onSubmit = vi.fn();
    renderCard({ onSubmit });
    clickButton("Withdraw token");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not submit while the token decimals are unknown", () => {
    const onSubmit = vi.fn();
    renderCard({ onSubmit, decimalsKnown: false });
    clickButton("Withdraw token");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("groups the balance", () => {
    renderCard();
    expect(screen.getByText("12,345.6789 USDC")).toBeDefined();
  });
});

describe("MaxDurationCard", () => {
  it("shows the value and passes the raw typed value", () => {
    const onChange = vi.fn();
    render(
      <MaxDurationCard
        maxDuration={undefined}
        value="current-value"
        onChange={onChange}
        isBusy={false}
        onSubmit={vi.fn()}
      />,
    );
    expect(input("New max duration (seconds)").value).toBe("current-value");
    type("New max duration (seconds)", "typed");
    expect(onChange.mock.calls).toEqual([["typed"]]);
  });

  it("submits from Update max duration", () => {
    const onSubmit = vi.fn();
    render(<MaxDurationCard maxDuration={undefined} value="" onChange={vi.fn()} isBusy={false} onSubmit={onSubmit} />);
    clickButton("Update max duration");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it.each([
    [31_536_000n, "31,536,000 seconds (365 days)"],
    [86_400n, "86,400 seconds (1 day)"],
    [90_000n, "90,000 seconds"],
  ])("shows a current max duration of %s as %j", (maxDuration, text) => {
    render(<MaxDurationCard maxDuration={maxDuration} value="" onChange={vi.fn()} isBusy={false} onSubmit={vi.fn()} />);
    expect(screen.getByText(text)).toBeDefined();
  });
});

describe("TransferOwnershipCard", () => {
  it("shows the value and passes the raw typed value", () => {
    const onChange = vi.fn();
    render(transferCard({ value: "current-value", onChange }));
    expect(input("New owner address").value).toBe("current-value");
    type("New owner address", "typed");
    expect(onChange.mock.calls).toEqual([["typed"]]);
  });

  it("asks for a review, never the wallet, from its button and from Enter in the field", () => {
    const onReview = vi.fn();
    const onConfirm = vi.fn();
    render(transferCard({ onReview, onConfirm }));
    clickButton("Transfer ownership");
    fireEvent.submit(input("New owner address").closest("form") as HTMLFormElement);
    expect(onReview).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("opens the confirm step as an outline destructive button in an outlined block", () => {
    render(transferCard());
    const trigger = screen.getByRole("button", { name: "Transfer ownership" });
    expect(trigger.className.split(" ")).toEqual(expect.arrayContaining(["border-input", "text-destructive!"]));
    expect(trigger.className).not.toContain("btn-error");
    expect(screen.getByRole("region", { name: "Transfer ownership" }).className).toContain("border-destructive");
  });

  it("has no dialog until the page sets a target", () => {
    render(transferCard());
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  describe("confirm dialog", () => {
    const NEW_OWNER = "0x5555555555555555555555555555555555555555";

    const renderOpen = (props: Partial<Parameters<typeof TransferOwnershipCard>[0]> = {}) => {
      const view = render(transferCard({ confirmTarget: NEW_OWNER, ...props }));
      return { ...view, dialog: within(screen.getByRole("alertdialog")) };
    };

    it("asks a question naming the new owner and states the consequence", () => {
      renderOpen();
      const dialog = screen.getByRole("alertdialog", { name: "Transfer ownership to 0x5555...5555?" });
      expect(dialog.hasAttribute("open")).toBe(true);
      expect(within(dialog).getByText(NEW_OWNER).className).toContain("font-data");
      expect(dialog.getAttribute("aria-describedby")).toBe("admin-transfer-confirm-description");
      expect(document.getElementById("admin-transfer-confirm-description")?.textContent).toContain(
        "This wallet loses every action on this page as soon as the transaction confirms.",
      );
    });

    it("names the thing on both buttons, focuses the keep button, and makes only the confirm solid destructive", () => {
      const { dialog } = renderOpen();
      const keep = dialog.getByRole("button", { name: "Keep ownership" });
      const confirm = dialog.getByRole("button", { name: "Transfer ownership" });
      expect(document.activeElement).toBe(keep);
      expect(keep.className).toContain("bg-secondary");
      expect(confirm.className).toContain("btn-error");
    });

    it.each([
      ["Transfer ownership", "onConfirm"],
      ["Keep ownership", "onCancelConfirm"],
    ] as const)("%s calls %s only", (label, handler) => {
      const onConfirm = vi.fn();
      const onCancelConfirm = vi.fn();
      const { dialog } = renderOpen({ onConfirm, onCancelConfirm });
      fireEvent.click(dialog.getByRole("button", { name: label }));
      expect({ onConfirm: onConfirm.mock.calls.length, onCancelConfirm: onCancelConfirm.mock.calls.length }).toEqual({
        onConfirm: handler === "onConfirm" ? 1 : 0,
        onCancelConfirm: handler === "onCancelConfirm" ? 1 : 0,
      });
    });

    it("reports Escape (the browser closing the dialog) as a cancel", () => {
      const onCancelConfirm = vi.fn();
      renderOpen({ onCancelConfirm });
      (screen.getByRole("alertdialog") as HTMLDialogElement).close();
      expect(onCancelConfirm).toHaveBeenCalledTimes(1);
    });

    it("closes when the page clears the target, and returns focus where it was", () => {
      const field = () => input("New owner address");
      const { rerender } = render(transferCard());
      field().focus();
      rerender(transferCard({ confirmTarget: NEW_OWNER }));
      expect(document.activeElement?.textContent).toBe("Keep ownership");
      const onCancelConfirm = vi.fn();
      rerender(transferCard({ onCancelConfirm }));
      expect(screen.queryByRole("alertdialog")).toBeNull();
      expect(document.getElementById("admin-transfer-confirm")?.hasAttribute("open")).toBe(false);
      expect(onCancelConfirm).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(field());
    });
  });
});

// Regression (F9): AddressInput resolved ENS names on Ethereum mainnet for transactions sent on Arbitrum.
describe.each([
  [
    "PlanCard token",
    (value: string, onChange: (value: string) => void, error?: string) => (
      <PlanCard
        form={{ tokenAddress: value, price: "", durationSeconds: "", enabled: true }}
        onChange={patch => onChange(patch.tokenAddress ?? "")}
        tokenDecimals={6}
        isDecimalsLoading={false}
        tokenSymbol="USDC"
        currentPlan={undefined}
        isBusy={false}
        fieldErrors={{ tokenAddress: error }}
        onSubmit={vi.fn()}
      />
    ),
    "Token address",
  ],
  [
    "WithdrawNativeCard destination",
    (value: string, onChange: (value: string) => void, error?: string) => (
      <WithdrawNativeCard
        form={{ to: value, amountEth: "" }}
        onChange={patch => onChange(patch.to ?? "")}
        balance={undefined}
        isBusy={false}
        fieldErrors={{ to: error }}
        onSubmit={vi.fn()}
      />
    ),
    "Destination address",
  ],
  [
    "WithdrawTokenCard token",
    (value: string, onChange: (value: string) => void, error?: string) => (
      <WithdrawTokenCard
        form={{ tokenAddress: value, to: "", amount: "" }}
        onChange={patch => onChange(patch.tokenAddress ?? "")}
        balance={undefined}
        tokenDecimals={6}
        isDecimalsLoading={false}
        tokenSymbol="USDC"
        isBusy={false}
        fieldErrors={{ tokenAddress: error }}
        onSubmit={vi.fn()}
      />
    ),
    "Token address",
  ],
  [
    "WithdrawTokenCard destination",
    (value: string, onChange: (value: string) => void, error?: string) => (
      <WithdrawTokenCard
        form={{ tokenAddress: "", to: value, amount: "" }}
        onChange={patch => onChange(patch.to ?? "")}
        balance={undefined}
        tokenDecimals={6}
        isDecimalsLoading={false}
        tokenSymbol="USDC"
        isBusy={false}
        fieldErrors={{ to: error }}
        onSubmit={vi.fn()}
      />
    ),
    "Destination address",
  ],
  [
    "TransferOwnershipCard",
    (value: string, onChange: (value: string) => void, error?: string) =>
      transferCard({ value, onChange, fieldErrors: { newOwner: error } }),
    "New owner address",
  ],
] as [string, (value: string, onChange: (value: string) => void, error?: string) => ReactElement, string][])(
  "%s address field",
  (_name, card, label) => {
    it.each([
      ["empty", "", false],
      ["lowercase hex", CHECKSUMMED.toLowerCase(), false],
      ["checksummed", CHECKSUMMED, false],
      ["an ENS name", "vitalik.eth", true],
      ["too short", "0x1234", true],
      ["mixed case with a wrong checksum", "0x79872D7529cfE1c062838fACDA004Ce4BFB16553", true],
    ])(
      "is a plain text input that flags a value that is %s when the owner leaves it: %j",
      (_label, value, isInvalid) => {
        render(card(value, vi.fn()));
        const control = input(label);
        expect(control.getAttribute("type")).toBe("text");
        // Nothing while typing: the value is not flagged before the field loses focus.
        expect(control.getAttribute("aria-invalid")).toBeNull();
        expect(screen.queryByText(ADDRESS_ERROR)).toBeNull();
        fireEvent.blur(control);
        expect(control.getAttribute("aria-invalid")).toBe(isInvalid ? "true" : null);
        // The red border is not the only signal: the message is visible and describes the input.
        expect(describedError(control)?.textContent ?? null).toBe(isInvalid ? ADDRESS_ERROR : null);
      },
    );

    it("re-checks on every change after an invalid blur, and clears as soon as the value is valid", () => {
      const { rerender } = render(card("0x1234", vi.fn()));
      fireEvent.blur(input(label));
      expect(input(label).getAttribute("aria-invalid")).toBe("true");
      rerender(card(CHECKSUMMED, vi.fn()));
      expect(input(label).getAttribute("aria-invalid")).toBeNull();
      expect(screen.queryByText(ADDRESS_ERROR)).toBeNull();
      rerender(card("0x12", vi.fn()));
      expect(input(label).getAttribute("aria-invalid")).toBe("true");
    });

    it("shows a failed submit's message without a blur", () => {
      render(card("", vi.fn(), "Enter the address as a full 0x address."));
      const control = input(label);
      expect(control.getAttribute("aria-invalid")).toBe("true");
      expect(describedError(control)?.textContent).toBe("Enter the address as a full 0x address.");
    });

    it("passes the typed value without the spaces around it", () => {
      const onChange = vi.fn();
      render(card("", onChange));
      type(label, ` ${CHECKSUMMED} `);
      expect(onChange.mock.calls).toEqual([[CHECKSUMMED]]);
    });
  },
);

describe.each([
  ["MaxDurationCard", "New max duration (seconds)", "maxDurationSeconds"],
  ["PlanCard", "Price (USDC)", "price"],
  ["PlanCard", "Duration (seconds)", "durationSeconds"],
  ["WithdrawNativeCard", "Amount (ETH)", "amountEth"],
  ["WithdrawTokenCard", "Amount (USDC)", "amount"],
] as const)("%s %j field error", (cardName, label, field) => {
  it("marks the field invalid and describes it with the message", () => {
    const fieldErrors = { [field]: "Enter a value like 1." };
    const props = { isBusy: false, onSubmit: vi.fn(), fieldErrors };
    const cards = {
      MaxDurationCard: () => <MaxDurationCard maxDuration={undefined} value="" onChange={vi.fn()} {...props} />,
      PlanCard: () => (
        <PlanCard
          form={{ tokenAddress: "", price: "", durationSeconds: "", enabled: true }}
          onChange={vi.fn()}
          tokenDecimals={6}
          isDecimalsLoading={false}
          tokenSymbol="USDC"
          currentPlan={undefined}
          {...props}
        />
      ),
      WithdrawNativeCard: () => (
        <WithdrawNativeCard form={{ to: "", amountEth: "" }} onChange={vi.fn()} balance={undefined} {...props} />
      ),
      WithdrawTokenCard: () => (
        <WithdrawTokenCard
          form={{ tokenAddress: "", to: "", amount: "" }}
          onChange={vi.fn()}
          balance={undefined}
          tokenDecimals={6}
          isDecimalsLoading={false}
          tokenSymbol="USDC"
          {...props}
        />
      ),
    };
    render(cards[cardName]());
    const control = input(label);
    expect(control.getAttribute("aria-invalid")).toBe("true");
    expect(describedError(control)?.textContent).toBe("Enter a value like 1.");
  });
});

describe("PauseCard", () => {
  it.each([
    [false, "Pause payments", "Active", "onPause"],
    [true, "Unpause payments", "Paused", "onUnpause"],
  ] as const)("paused %s: offers %j next to the %j status, wired to %s", (paused, label, status, handler) => {
    const onPause = vi.fn();
    const onUnpause = vi.fn();
    render(<PauseCard paused={paused} isBusy={false} onPause={onPause} onUnpause={onUnpause} />);
    const card = within(screen.getByRole("region", { name: "Payments" }));
    expect(card.getAllByRole("button").map(button => button.textContent)).toEqual([label]);
    expect(card.getByText("Current status")).toBeDefined();
    expect(card.getByText(status)).toBeDefined();
    clickButton(label);
    expect({ onPause: onPause.mock.calls.length, onUnpause: onUnpause.mock.calls.length }).toEqual({
      onPause: handler === "onPause" ? 1 : 0,
      onUnpause: handler === "onUnpause" ? 1 : 0,
    });
  });

  it("is disabled while the status is unknown, which the status row says", () => {
    render(<PauseCard paused={undefined} isBusy={false} onPause={vi.fn()} onUnpause={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Pause payments" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("No data")).toBeDefined();
  });

  it("keeps the same, enabled button when a confirmed pause flips the status", () => {
    const { rerender } = render(<PauseCard paused={false} isBusy={false} onPause={vi.fn()} onUnpause={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Pause payments" });
    button.focus();
    rerender(<PauseCard paused isBusy={false} onPause={vi.fn()} onUnpause={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Unpause payments" })).toBe(button);
    expect(button.hasAttribute("disabled")).toBe(false);
    expect(document.activeElement).toBe(button);
  });

  it.each([
    [false, "processing", "Pausing"],
    [true, "processing", "Unpausing"],
    [false, "wallet", "Waiting for your wallet"],
  ] as const)("paused %s, %s: shows %j", (paused, pending, loading) => {
    render(<PauseCard paused={paused} isBusy pending={pending} onPause={vi.fn()} onUnpause={vi.fn()} />);
    const button = screen.getByRole("button", { name: loading });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.hasAttribute("disabled")).toBe(false);
  });
});

type CardStateProps = {
  isBusy: boolean;
  pending?: TxPhase;
  error?: AdminTxError;
  onSubmit: () => void;
};

// Every form card in one table: a field, its submit label, and the label while its own transaction is processing.
const FORM_CARDS = [
  [
    "MaxDurationCard",
    (props: CardStateProps) => <MaxDurationCard maxDuration={undefined} value="" onChange={vi.fn()} {...props} />,
    "New max duration (seconds)",
    "Update max duration",
    "Updating",
  ],
  [
    "PlanCard",
    (props: CardStateProps) => (
      <PlanCard
        form={{ tokenAddress: "", price: "", durationSeconds: "", enabled: true }}
        onChange={vi.fn()}
        tokenDecimals={6}
        isDecimalsLoading={false}
        tokenSymbol="USDC"
        currentPlan={undefined}
        {...props}
      />
    ),
    "Price (USDC)",
    "Save plan",
    "Saving",
  ],
  [
    "WithdrawNativeCard",
    (props: CardStateProps) => (
      <WithdrawNativeCard form={{ to: "", amountEth: "" }} onChange={vi.fn()} balance={undefined} {...props} />
    ),
    "Destination address",
    "Withdraw ETH",
    "Withdrawing",
  ],
  [
    "WithdrawTokenCard",
    (props: CardStateProps) => (
      <WithdrawTokenCard
        form={{ tokenAddress: "", to: "", amount: "" }}
        onChange={vi.fn()}
        balance={undefined}
        tokenDecimals={6}
        isDecimalsLoading={false}
        tokenSymbol="USDC"
        {...props}
      />
    ),
    "Amount (USDC)",
    "Withdraw token",
    "Withdrawing",
  ],
  [
    "TransferOwnershipCard",
    ({ onSubmit, ...props }: CardStateProps) => transferCard({ onReview: onSubmit, ...props }),
    "New owner address",
    "Transfer ownership",
    "Transferring",
  ],
] as const;

describe.each(FORM_CARDS)("%s states", (_name, card, fieldLabel, buttonLabel, loadingLabel) => {
  it("is a form whose submit event calls onSubmit, with its type=submit button inside", () => {
    const onSubmit = vi.fn();
    render(card({ isBusy: false, onSubmit }));
    const form = input(fieldLabel).closest("form");
    const button = screen.getByRole("button", { name: buttonLabel });
    expect(form).not.toBeNull();
    expect(button.getAttribute("type")).toBe("submit");
    expect(button.closest("form")).toBe(form);
    fireEvent.submit(form as HTMLFormElement);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it(`shows its own processing transaction as ${loadingLabel}, focusable but inert`, () => {
    const onSubmit = vi.fn();
    render(card({ isBusy: true, pending: "processing", onSubmit }));
    const button = screen.getByRole("button", { name: loadingLabel });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.hasAttribute("disabled")).toBe(false);
    fireEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByText("Confirm the transaction in your wallet.")).toBeNull();
  });

  it("says where to look while the wallet prompt is open", () => {
    render(card({ isBusy: true, pending: "wallet", onSubmit: vi.fn() }));
    expect(screen.getByRole("button", { name: "Waiting for your wallet" }).getAttribute("aria-busy")).toBe("true");
    const status = screen.getByText("Confirm the transaction in your wallet.");
    expect(status.getAttribute("aria-live")).toBe("polite");
  });

  it("is disabled while another action's transaction is pending", () => {
    render(card({ isBusy: true, onSubmit: vi.fn() }));
    expect(screen.getByRole("button", { name: buttonLabel }).hasAttribute("disabled")).toBe(true);
  });

  it("announces a failure assertively, and a cancel in the wallet politely and in neutral colours", () => {
    const { rerender } = render(
      card({
        isBusy: false,
        error: { tone: "destructive", title: "Transaction failed", message: "Enter a price above 0." },
        onSubmit: vi.fn(),
      }),
    );
    const failure = screen.getByText("Transaction failed").closest("[data-variant]");
    expect(failure?.getAttribute("data-variant")).toBe("destructive");
    expect(failure?.textContent).toContain("Enter a price above 0.");
    // Mounted with the card, so the error rendered into it later is announced.
    expect(failure?.closest("[aria-live]")?.getAttribute("aria-live")).toBe("assertive");
    rerender(
      card({
        isBusy: false,
        error: { tone: "neutral", title: "Request cancelled", message: "Nothing was sent." },
        onSubmit: vi.fn(),
      }),
    );
    expect(screen.queryByText("Transaction failed")).toBeNull();
    const cancel = screen.getByText("Request cancelled").closest("[data-variant]");
    expect(cancel?.getAttribute("data-variant")).toBe("default");
    expect(cancel?.closest("[aria-live]")?.getAttribute("aria-live")).toBe("polite");
  });
});
