import type { ReactElement, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { MaxDurationCard } from "~~/app/admin/_components/MaxDurationCard";
import { PauseCard } from "~~/app/admin/_components/PauseCard";
import { PlanCard } from "~~/app/admin/_components/PlanCard";
import { TransferOwnershipCard } from "~~/app/admin/_components/TransferOwnershipCard";
import { WithdrawNativeCard } from "~~/app/admin/_components/WithdrawNativeCard";
import { WithdrawTokenCard } from "~~/app/admin/_components/WithdrawTokenCard";

type HostElement = ReactElement<{
  children?: ReactNode;
  onClick?: () => void;
  onChange?: (event: { target: { value?: string; checked?: boolean } }) => void;
  placeholder?: string;
  type?: string;
  value?: string;
  checked?: boolean;
}>;

/** Host elements in document order. The cards are hook-free, so nested components are expanded by calling them. */
const hostElements = (node: ReactNode): HostElement[] => {
  if (Array.isArray(node)) return node.flatMap(hostElements);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as HostElement;
  if (typeof element.type === "function") {
    return hostElements((element.type as (props: unknown) => ReactNode)(element.props));
  }
  return [element, ...hostElements(element.props.children)];
};

const inputByPlaceholder = (card: ReactNode, placeholder: string) => {
  const input = hostElements(card).find(
    element => element.type === "input" && element.props.placeholder === placeholder,
  );
  expect(input, placeholder).toBeDefined();
  return input as HostElement;
};

const button = (card: ReactNode, label: string) => {
  const found = hostElements(card).find(element => element.type === "button" && element.props.children === label);
  expect(found, label).toBeDefined();
  return found as HostElement;
};

const type = (input: HostElement, value: string) => input.props.onChange?.({ target: { value } });

describe("PlanCard", () => {
  const form = { tokenAddress: "token-value", price: "price-value", durationSeconds: "duration-value", enabled: false };
  const renderCard = (onChange = vi.fn(), onSubmit = vi.fn()) =>
    PlanCard({
      form,
      onChange,
      tokenDecimals: 6,
      tokenSymbol: "USDC",
      currentPlan: undefined,
      isBusy: false,
      onSubmit,
    });

  it.each([
    ["Token address", "tokenAddress"],
    ["Price (USDC)", "price"],
    ["Duration seconds", "durationSeconds"],
  ] as const)("the %j input shows and patches form.%s", (placeholder, field) => {
    const onChange = vi.fn();
    const input = inputByPlaceholder(renderCard(onChange), placeholder);
    expect(input.props.value).toBe(form[field]);
    type(input, "typed");
    expect(onChange.mock.calls).toEqual([[{ [field]: "typed" }]]);
  });

  it("the checkbox shows and patches form.enabled", () => {
    const onChange = vi.fn();
    const checkbox = hostElements(renderCard(onChange)).find(element => element.props.type === "checkbox");
    expect(checkbox?.props.checked).toBe(false);
    checkbox?.props.onChange?.({ target: { checked: true } });
    expect(onChange.mock.calls).toEqual([[{ enabled: true }]]);
  });

  it("submits from Save plan", () => {
    const onSubmit = vi.fn();
    button(renderCard(vi.fn(), onSubmit), "Save plan").props.onClick?.();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("WithdrawNativeCard", () => {
  const form = { to: "to-value", amountEth: "amount-value" };
  const renderCard = (onChange = vi.fn(), onSubmit = vi.fn()) =>
    WithdrawNativeCard({ form, onChange, balance: undefined, isBusy: false, onSubmit });

  it.each([
    ["Destination address", "to"],
    ["Amount in ETH", "amountEth"],
  ] as const)("the %j input shows and patches form.%s", (placeholder, field) => {
    const onChange = vi.fn();
    const input = inputByPlaceholder(renderCard(onChange), placeholder);
    expect(input.props.value).toBe(form[field]);
    type(input, "typed");
    expect(onChange.mock.calls).toEqual([[{ [field]: "typed" }]]);
  });

  it("submits from Withdraw native", () => {
    const onSubmit = vi.fn();
    button(renderCard(vi.fn(), onSubmit), "Withdraw native").props.onClick?.();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("WithdrawTokenCard", () => {
  const form = { tokenAddress: "token-value", to: "to-value", amount: "amount-value" };
  const renderCard = (onChange = vi.fn(), onSubmit = vi.fn()) =>
    WithdrawTokenCard({
      form,
      onChange,
      balance: undefined,
      tokenDecimals: 18,
      tokenSymbol: "DAI",
      isBusy: false,
      onSubmit,
    });

  it.each([
    ["Token address", "tokenAddress"],
    ["Destination address", "to"],
    ["Amount (DAI)", "amount"],
  ] as const)("the %j input shows and patches form.%s", (placeholder, field) => {
    const onChange = vi.fn();
    const input = inputByPlaceholder(renderCard(onChange), placeholder);
    expect(input.props.value).toBe(form[field]);
    type(input, "typed");
    expect(onChange.mock.calls).toEqual([[{ [field]: "typed" }]]);
  });

  it("submits from Withdraw token", () => {
    const onSubmit = vi.fn();
    button(renderCard(vi.fn(), onSubmit), "Withdraw token").props.onClick?.();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe.each([
  [
    "MaxDurationCard",
    (onChange: (value: string) => void, onSubmit: () => void) =>
      MaxDurationCard({ maxDuration: undefined, value: "current-value", onChange, isBusy: false, onSubmit }),
    "New max duration (seconds)",
    "Update max duration",
  ],
  [
    "TransferOwnershipCard",
    (onChange: (value: string) => void, onSubmit: () => void) =>
      TransferOwnershipCard({ value: "current-value", onChange, isBusy: false, onSubmit }),
    "New owner address",
    "Transfer ownership",
  ],
])("%s", (_name, renderCard, placeholder, label) => {
  it("shows the value and passes the raw typed value", () => {
    const onChange = vi.fn();
    const input = inputByPlaceholder(renderCard(onChange, vi.fn()), placeholder);
    expect(input.props.value).toBe("current-value");
    type(input, "typed");
    expect(onChange.mock.calls).toEqual([["typed"]]);
  });

  it(`submits from ${label}`, () => {
    const onSubmit = vi.fn();
    button(renderCard(vi.fn(), onSubmit), label).props.onClick?.();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("PauseCard", () => {
  it("wires Pause and Unpause to their own handlers", () => {
    const onPause = vi.fn();
    const onUnpause = vi.fn();
    const card = PauseCard({ paused: false, isBusy: false, onPause, onUnpause });
    button(card, "Pause").props.onClick?.();
    expect([onPause.mock.calls.length, onUnpause.mock.calls.length]).toEqual([1, 0]);
    button(card, "Unpause").props.onClick?.();
    expect([onPause.mock.calls.length, onUnpause.mock.calls.length]).toEqual([1, 1]);
  });
});
