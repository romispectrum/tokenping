// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MaxDurationCard } from "~~/app/admin/_components/MaxDurationCard";
import { PauseCard } from "~~/app/admin/_components/PauseCard";
import { PlanCard } from "~~/app/admin/_components/PlanCard";
import { TransferOwnershipCard } from "~~/app/admin/_components/TransferOwnershipCard";
import { WithdrawNativeCard } from "~~/app/admin/_components/WithdrawNativeCard";
import { WithdrawTokenCard } from "~~/app/admin/_components/WithdrawTokenCard";

// A plain input with the scaffold-ui props: the real EtherInput fetches the ETH price.
vi.mock("@scaffold-ui/components", () => ({
  EtherInput: ({
    defaultValue,
    onValueChange,
    placeholder,
  }: {
    defaultValue?: string;
    onValueChange?: (value: { valueInEth: string; valueInUsd: string; displayUsdMode: boolean }) => void;
    placeholder?: string;
  }) => (
    <input
      placeholder={placeholder}
      defaultValue={defaultValue}
      onChange={event => onValueChange?.({ valueInEth: event.target.value, valueInUsd: "", displayUsdMode: false })}
    />
  ),
}));

const input = (label: string) => screen.getByLabelText(label) as HTMLInputElement;

const type = (label: string, value: string) => fireEvent.change(input(label), { target: { value } });

const clickButton = (label: string) => fireEvent.click(screen.getByRole("button", { name: label }));

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
});

describe("WithdrawNativeCard", () => {
  const form = { to: "to-value", amountEth: "amount-value" };
  const renderCard = (onChange = vi.fn(), onSubmit = vi.fn()) =>
    render(
      <WithdrawNativeCard form={form} onChange={onChange} balance={undefined} isBusy={false} onSubmit={onSubmit} />,
    );

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

  it("submits from Withdraw native", () => {
    const onSubmit = vi.fn();
    renderCard(vi.fn(), onSubmit);
    clickButton("Withdraw native");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("WithdrawTokenCard", () => {
  const form = { tokenAddress: "token-value", to: "to-value", amount: "amount-value" };
  const renderCard = ({ onChange = vi.fn(), onSubmit = vi.fn(), decimalsKnown = true } = {}) =>
    render(
      <WithdrawTokenCard
        form={form}
        onChange={onChange}
        balance={undefined}
        tokenDecimals={decimalsKnown ? 18 : undefined}
        isDecimalsLoading={false}
        tokenSymbol="DAI"
        isBusy={false}
        onSubmit={onSubmit}
      />,
    );

  it.each([
    ["Token address", "tokenAddress"],
    ["Destination address", "to"],
    ["Amount (DAI)", "amount"],
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
});

describe.each([
  [
    "MaxDurationCard",
    (onChange: (value: string) => void, onSubmit: () => void) => (
      <MaxDurationCard
        maxDuration={undefined}
        value="current-value"
        onChange={onChange}
        isBusy={false}
        onSubmit={onSubmit}
      />
    ),
    "New max duration (seconds)",
    "Update max duration",
  ],
  [
    "TransferOwnershipCard",
    (onChange: (value: string) => void, onSubmit: () => void) => (
      <TransferOwnershipCard value="current-value" onChange={onChange} isBusy={false} onSubmit={onSubmit} />
    ),
    "New owner address",
    "Transfer ownership",
  ],
])("%s", (_name, card, label, buttonLabel) => {
  it("shows the value and passes the raw typed value", () => {
    const onChange = vi.fn();
    render(card(onChange, vi.fn()));
    expect(input(label).value).toBe("current-value");
    type(label, "typed");
    expect(onChange.mock.calls).toEqual([["typed"]]);
  });

  it(`submits from ${buttonLabel}`, () => {
    const onSubmit = vi.fn();
    render(card(vi.fn(), onSubmit));
    clickButton(buttonLabel);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

// Regression (F9): AddressInput resolved ENS names on Ethereum mainnet for transactions sent on Arbitrum.
describe.each([
  [
    "PlanCard token",
    (value: string, onChange: (value: string) => void) => (
      <PlanCard
        form={{ tokenAddress: value, price: "", durationSeconds: "", enabled: true }}
        onChange={patch => onChange(patch.tokenAddress ?? "")}
        tokenDecimals={6}
        isDecimalsLoading={false}
        tokenSymbol="USDC"
        currentPlan={undefined}
        isBusy={false}
        onSubmit={vi.fn()}
      />
    ),
    "Token address",
  ],
  [
    "WithdrawNativeCard destination",
    (value: string, onChange: (value: string) => void) => (
      <WithdrawNativeCard
        form={{ to: value, amountEth: "" }}
        onChange={patch => onChange(patch.to ?? "")}
        balance={undefined}
        isBusy={false}
        onSubmit={vi.fn()}
      />
    ),
    "Destination address",
  ],
  [
    "WithdrawTokenCard token",
    (value: string, onChange: (value: string) => void) => (
      <WithdrawTokenCard
        form={{ tokenAddress: value, to: "", amount: "" }}
        onChange={patch => onChange(patch.tokenAddress ?? "")}
        balance={undefined}
        tokenDecimals={6}
        isDecimalsLoading={false}
        tokenSymbol="USDC"
        isBusy={false}
        onSubmit={vi.fn()}
      />
    ),
    "Token address",
  ],
  [
    "WithdrawTokenCard destination",
    (value: string, onChange: (value: string) => void) => (
      <WithdrawTokenCard
        form={{ tokenAddress: "", to: value, amount: "" }}
        onChange={patch => onChange(patch.to ?? "")}
        balance={undefined}
        tokenDecimals={6}
        isDecimalsLoading={false}
        tokenSymbol="USDC"
        isBusy={false}
        onSubmit={vi.fn()}
      />
    ),
    "Destination address",
  ],
  [
    "TransferOwnershipCard",
    (value: string, onChange: (value: string) => void) => (
      <TransferOwnershipCard value={value} onChange={onChange} isBusy={false} onSubmit={vi.fn()} />
    ),
    "New owner address",
  ],
])("%s address field", (_name, card, label) => {
  const CHECKSUMMED = "0x79872d7529cfE1c062838fACDA004Ce4BFB16553";

  it.each([
    ["empty", "", false],
    ["lowercase hex", CHECKSUMMED.toLowerCase(), false],
    ["checksummed", CHECKSUMMED, false],
    ["an ENS name", "vitalik.eth", true],
    ["too short", "0x1234", true],
    ["mixed case with a wrong checksum", "0x79872D7529cfE1c062838fACDA004Ce4BFB16553", true],
  ])("is a plain text input that flags a value that is %s: %j", (_label, value, isInvalid) => {
    render(card(value, vi.fn()));
    const control = input(label);
    expect(control.getAttribute("type")).toBe("text");
    expect(control.getAttribute("aria-invalid")).toBe(isInvalid ? "true" : null);
    expect(control.classList.contains("input-error")).toBe(isInvalid);
  });

  it("passes the typed value without the spaces around it", () => {
    const onChange = vi.fn();
    render(card("", onChange));
    type(label, ` ${CHECKSUMMED} `);
    expect(onChange.mock.calls).toEqual([[CHECKSUMMED]]);
  });
});

describe("PauseCard", () => {
  it.each([
    [false, "Pause", [1, 0]],
    [true, "Unpause", [0, 1]],
  ] as const)("wires the enabled button to its own handler (paused: %s)", (paused, label, expected) => {
    const onPause = vi.fn();
    const onUnpause = vi.fn();
    render(<PauseCard paused={paused} isBusy={false} onPause={onPause} onUnpause={onUnpause} />);
    clickButton("Pause");
    clickButton("Unpause");
    expect([onPause.mock.calls.length, onUnpause.mock.calls.length]).toEqual(expected);
    expect(screen.getByRole("button", { name: label }).hasAttribute("disabled")).toBe(false);
  });
});
