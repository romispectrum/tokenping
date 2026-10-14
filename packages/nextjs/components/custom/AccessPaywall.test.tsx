import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessPaywall } from "~~/components/custom/AccessPaywall";
import { renderStaticMarkup } from "~~/utils/testing/render";

const PAYWALL = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const TOKEN = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
const USER = "0x1111111111111111111111111111111111111111";

const { state, calls, notification, resetState } = vi.hoisted(() => {
  const calls: unknown[][] = [];
  const record =
    (name: string) =>
    (...args: unknown[]) => {
      calls.push([name, ...args]);
    };
  const initialState = () => ({
    address: undefined as string | undefined,
    walletChainId: undefined as number | undefined,
    paymentChainId: 42161 as number | undefined,
    paymentTokenAddress: undefined as string | undefined,
    isActive: false,
    plan: null as { price: bigint; durationSeconds: bigint; enabled: boolean } | null,
    expiryTimestamp: 0n,
    currentAllowance: 0n,
    isPayPending: false,
    isApprovePending: false,
    paywallContract: undefined as { address: string } | undefined,
    approveImpl: (() => Promise.resolve("0xapprove")) as (...args: unknown[]) => unknown,
    payImpl: (() => Promise.resolve("0xpay")) as (...args: unknown[]) => unknown,
  });
  const state = initialState();
  return {
    state,
    calls,
    notification: {
      success: record("notification.success"),
      error: record("notification.error"),
    },
    resetState: () => {
      Object.assign(state, initialState());
      calls.length = 0;
    },
  };
});

vi.mock("wagmi", () => ({
  useAccount: () => ({
    address: state.address,
    chain: state.walletChainId === undefined ? undefined : { id: state.walletChainId },
  }),
  useSwitchChain: () => ({
    switchChain: (...args: unknown[]) => calls.push(["switchChain", ...args]),
  }),
}));

vi.mock("~~/hooks/custom/useAccess", () => ({
  useAccess: () => ({
    paymentTokenAddress: state.paymentTokenAddress,
    isActive: state.isActive,
    plan: state.plan,
    expiryTimestamp: state.expiryTimestamp,
    refetch: (...args: unknown[]) => {
      calls.push(["refetch", ...args]);
    },
    payAsync: (...args: unknown[]) => {
      calls.push(["payAsync", ...args]);
      return state.payImpl(...args);
    },
    approveAsync: (...args: unknown[]) => {
      calls.push(["approveAsync", ...args]);
      return state.approveImpl(...args);
    },
    currentAllowance: state.currentAllowance,
    isPayPending: state.isPayPending,
    isApprovePending: state.isApprovePending,
  }),
}));

vi.mock("~~/hooks/scaffold-eth", () => ({
  useDeployedContractInfo: (config: unknown) => {
    calls.push(["useDeployedContractInfo", config]);
    return { data: state.paywallContract, isLoading: false };
  },
}));

vi.mock("~~/utils/scaffold-eth", () => ({ notification }));

vi.mock("~~/constants/payments", async importOriginal => ({
  ...(await importOriginal<typeof import("~~/constants/payments")>()),
  get PAYMENT_CHAIN_ID() {
    return state.paymentChainId;
  },
}));

type Props = Parameters<typeof AccessPaywall>[0];

/** Renders the paywall and also returns the element tree it produced, so click handlers can be invoked. */
const renderPaywall = (props: Partial<Props> = {}) => {
  let tree: ReactElement | undefined;
  const Probe = () => {
    tree = AccessPaywall({ children: <div>child</div>, ...props }) as ReactElement;
    return tree;
  };
  const html = renderStaticMarkup(<Probe />);
  return { html, tree: tree as ReactElement };
};

const findButtons = (node: ReactNode): ReactElement<{ onClick?: () => unknown }>[] => {
  if (Array.isArray(node)) return node.flatMap(findButtons);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ReactElement<{ children?: ReactNode; onClick?: () => unknown }>;
  const nested = findButtons(element.props.children);
  return element.type === "button" ? [element, ...nested] : nested;
};

const setReady = () => {
  state.address = USER;
  state.walletChainId = 42161;
  state.paymentTokenAddress = TOKEN;
  state.plan = { price: 1_500_000n, durationSeconds: 2_592_000n, enabled: true };
  state.paywallContract = { address: PAYWALL };
};

beforeEach(() => {
  resetState();
});

describe("AccessPaywall markup", () => {
  it("shows the expiry date and children when access is active", () => {
    state.isActive = true;
    state.expiryTimestamp = 1_800_000_000n;
    const date = new Date(1_800_000_000 * 1000).toLocaleDateString(undefined, { dateStyle: "medium" });
    const { html } = renderPaywall();
    expect(html).toContain(date);
    expect(html.replace(date, "<DATE>")).toMatchSnapshot();
  });

  it("hides the expiry line when the expiry timestamp is zero", () => {
    state.isActive = true;
    expect(renderPaywall().html).toMatchSnapshot();
  });

  it("asks to connect a wallet first", () => {
    expect(renderPaywall().html).toMatchSnapshot();
  });

  it("reports a missing payment contract after the wallet check", () => {
    state.address = USER;
    state.paymentChainId = undefined;
    expect(renderPaywall().html).toMatchSnapshot();
  });

  it("offers a network switch on the wrong chain", () => {
    state.address = USER;
    state.walletChainId = 1;
    expect(renderPaywall().html).toMatchSnapshot();
  });

  it("treats an unknown wallet chain as the wrong chain", () => {
    state.address = USER;
    expect(renderPaywall().html).toMatchSnapshot();
  });

  it.each([
    ["missing", null],
    ["disabled", { price: 1_500_000n, durationSeconds: 2_592_000n, enabled: false }],
  ])("reports no paid plan when the plan is %s", (_label, plan) => {
    state.address = USER;
    state.walletChainId = 42161;
    state.plan = plan;
    expect(renderPaywall().html).toMatchSnapshot();
  });

  it("shows the price and an enabled pay button when ready", () => {
    setReady();
    expect(renderPaywall().html).toMatchSnapshot();
  });

  it("uses the extend copy for an existing config", () => {
    setReady();
    expect(renderPaywall({ hasExistingConfig: true }).html).toMatchSnapshot();
  });

  it("lets the description prop override the default copy", () => {
    setReady();
    expect(renderPaywall({ hasExistingConfig: true, description: "Custom copy" }).html).toMatchSnapshot();
  });

  it.each([
    ["isPayPending", () => (state.isPayPending = true)],
    ["isApprovePending", () => (state.isApprovePending = true)],
  ])("shows Processing... while %s", (_label, arrange) => {
    setReady();
    arrange();
    expect(renderPaywall().html).toMatchSnapshot();
  });

  it.each([
    ["the price is zero", () => (state.plan = { price: 0n, durationSeconds: 2_592_000n, enabled: true })],
    ["there is no payment token", () => (state.paymentTokenAddress = undefined)],
  ])("disables the pay button when %s", (_label, arrange) => {
    setReady();
    arrange();
    expect(renderPaywall().html).toMatchSnapshot();
  });

  it("rounds the access duration to whole days with toFixed", () => {
    setReady();
    state.plan = { price: 1_000_000_000n, durationSeconds: 129_600n, enabled: true };
    expect(renderPaywall().html).toContain(
      '>1,000 USDC</span><span class="text-sm font-medium text-base-content/90 dark:text-gray-300">≈ 2 days access<',
    );
  });

  it("looks up the deployed paywall on the payment chain", () => {
    renderPaywall();
    expect(calls).toContainEqual(["useDeployedContractInfo", { contractName: "TokenpingPaywall", chainId: 42161 }]);
    resetState();
    state.paymentChainId = undefined;
    renderPaywall();
    expect(calls).toContainEqual(["useDeployedContractInfo", { contractName: "TokenpingPaywall", chainId: undefined }]);
  });
});

describe("AccessPaywall actions", () => {
  const clickOnlyButton = async () => {
    const buttons = findButtons(renderPaywall().tree);
    expect(buttons).toHaveLength(1);
    calls.length = 0;
    await buttons[0].props.onClick?.();
    return calls.filter(([name]) => name !== "useDeployedContractInfo");
  };

  it("switches to the payment chain", async () => {
    state.address = USER;
    state.walletChainId = 1;
    expect(await clickOnlyButton()).toEqual([["switchChain", { chainId: 42161 }]]);
  });

  it("approves the exact price, pays, toasts success and refetches", async () => {
    setReady();
    state.currentAllowance = 1_499_999n;
    expect(await clickOnlyButton()).toEqual([
      ["approveAsync", PAYWALL, 1_500_000n],
      ["payAsync", { functionName: "pay", args: [TOKEN] }],
      ["notification.success", "Access active. You can now configure notifications."],
      ["refetch"],
    ]);
  });

  it("skips the approval when the allowance covers the price", async () => {
    setReady();
    state.currentAllowance = 1_500_000n;
    expect(await clickOnlyButton()).toEqual([
      ["payAsync", { functionName: "pay", args: [TOKEN] }],
      ["notification.success", "Access active. You can now configure notifications."],
      ["refetch"],
    ]);
  });

  it("refuses to pay before the deployed paywall is confirmed", async () => {
    setReady();
    state.paywallContract = undefined;
    expect(await clickOnlyButton()).toEqual([
      ["notification.error", "Paid access not available. Check plan and wallet."],
    ]);
  });

  it("toasts the error message when the approval fails", async () => {
    setReady();
    state.approveImpl = () => Promise.reject(new Error("User rejected"));
    expect(await clickOnlyButton()).toEqual([
      ["approveAsync", PAYWALL, 1_500_000n],
      ["notification.error", "User rejected"],
    ]);
  });

  it("falls back to a generic message for non-Error failures", async () => {
    setReady();
    state.currentAllowance = 1_500_000n;
    state.payImpl = () => Promise.reject("nope");
    expect(await clickOnlyButton()).toEqual([
      ["payAsync", { functionName: "pay", args: [TOKEN] }],
      ["notification.error", "Payment failed"],
    ]);
  });

  // BUG(B2.2): payAsync resolves undefined without throwing when the write aborts, and success is still toasted.
  it("toasts success even when the pay write resolves undefined", async () => {
    setReady();
    state.currentAllowance = 1_500_000n;
    state.payImpl = () => Promise.resolve(undefined);
    expect(await clickOnlyButton()).toContainEqual([
      "notification.success",
      "Access active. You can now configure notifications.",
    ]);
  });
});
