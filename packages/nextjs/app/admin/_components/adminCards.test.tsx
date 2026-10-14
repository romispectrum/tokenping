// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MaxDurationCard } from "~~/app/admin/_components/MaxDurationCard";
import { PauseCard } from "~~/app/admin/_components/PauseCard";
import { PlanCard } from "~~/app/admin/_components/PlanCard";
import { TransferOwnershipCard } from "~~/app/admin/_components/TransferOwnershipCard";
import { WithdrawNativeCard } from "~~/app/admin/_components/WithdrawNativeCard";
import { WithdrawTokenCard } from "~~/app/admin/_components/WithdrawTokenCard";

// Plain inputs with the scaffold-ui props: the real ones resolve ENS names and fetch the ETH price.
vi.mock("@scaffold-ui/components", () => ({
  AddressInput: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }) => <input placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} />,
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
