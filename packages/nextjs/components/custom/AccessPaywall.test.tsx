// @vitest-environment jsdom
import { QueryClient } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { erc20Abi } from "viem";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccessPaywall } from "~~/components/custom/AccessPaywall";
import { deferred } from "~~/utils/testing/helpers";
import { renderWithProviders } from "~~/utils/testing/providers";

// Hoisted: useAccess reads the payment constants (mocked below) as soon as it is imported.
const { PAYWALL, TOKEN } = vi.hoisted(() => ({
  PAYWALL: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  TOKEN: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
}));
const USER = "0x1111111111111111111111111111111111111111";
const PAYMENT_CHAIN_ID = 42161;
const PRICE = 1_500_000n;
const SUCCESS = "Access active. You can now configure notifications.";
const PENDING = "Payment confirmed — access will appear shortly.";
const UNAVAILABLE = "Paid access is not available right now.";

type Plan = readonly [price: bigint, durationSeconds: bigint, enabled: boolean];
type ReadName = "isActive" | "plans" | "expiryTimestampByUser" | "allowance" | "paused";

/**
 * The real AccessPaywall and useAccess run on top of fake wagmi and SE-2 hooks backed by a tiny fake chain. Reads return
 * what was cached at render time (undefined while loading); refetches and mined transactions update the chain and cache.
 * The SE-2 fakes toast their own errors the way useTransactor and the scaffold `pay` simulation do.
 */
const { fake, resetFake } = vi.hoisted(() => {
  const initialChain = () => ({
    isActive: false,
    plans: [1_500_000n, 2_592_000n, true] as Plan | null,
    expiryTimestampByUser: 0n,
    allowance: 0n,
    paused: false,
  });
  const initialFake = () => ({
    chain: initialChain(),
    cache: {} as Partial<ReturnType<typeof initialChain>>,
    failingReads: new Set<string>(),
    wallet: { address: undefined as string | undefined, chainId: undefined as number | undefined },
    paymentChainId: 42161 as number | undefined,
    /** useDeployedContractInfo: the paywall's code was found, is still being checked, or was not found. */
    paywallCheck: "deployed" as "deployed" | "loading" | "missing",
    /** Approvals the wallet signed that are not mined yet. */
    pendingAllowance: undefined as bigint | undefined,
    approveImpl: undefined as (() => Promise<string>) | undefined,
    walletClientReady: true,
    mineApproval: undefined as Promise<void> | undefined,
    payImpl: undefined as (() => Promise<string | undefined>) | undefined,
    /** Allowance refetches after a mined approval that still return the old value, like a lagging RPC node. */
    staleAllowanceReads: 0,
    /** isActive refetches after a sent payment that still return the old value, like a lagging RPC node. */
    staleActiveReads: 0,
    /** A refetch of that read waits for the promise before it settles. */
    refetchGates: {} as Partial<Record<ReadName, Promise<void>>>,
    approvals: [] as unknown[],
    events: [] as string[],
    toasts: [] as [kind: "success" | "error", message: string][],
  });
  const fake = initialFake();
  return { fake, resetFake: () => Object.assign(fake, initialFake()) };
});

const loadReads = (...names: ReadName[]) => {
  const all: ReadName[] = ["isActive", "plans", "expiryTimestampByUser", "allowance", "paused"];
  for (const name of names.length ? names : all) {
    (fake.cache as Record<string, unknown>)[name] = fake.chain[name];
  }
};

const fakeRead = (name: ReadName) => ({
  data: fake.cache[name],
  isError: fake.failingReads.has(name),
  isLoading: fake.cache[name] === undefined && !fake.failingReads.has(name),
  refetch: async () => {
    fake.events.push(`refetch ${name}`);
    await fake.refetchGates[name];
    // Like react-query: a failed refetch keeps the last value and reports the error.
    if (fake.failingReads.has(name)) return { data: fake.cache[name], isError: true };
    if (name === "allowance" && fake.staleAllowanceReads > 0 && fake.events.includes("approve mined")) {
      fake.staleAllowanceReads -= 1;
      return { data: fake.cache[name], isError: false };
    }
    if (name === "isActive" && fake.staleActiveReads > 0 && fake.events.some(event => event.startsWith("pay sent"))) {
      fake.staleActiveReads -= 1;
      return { data: fake.cache[name], isError: false };
    }
    loadReads(name);
    return { data: fake.cache[name], isError: false };
  },
});

vi.mock("wagmi", () => ({
  useAccount: () => ({
    address: fake.wallet.address,
    chain: fake.wallet.chainId === undefined ? undefined : { id: fake.wallet.chainId },
  }),
  useSwitchChain: () => ({
    switchChain: (args: unknown) => fake.events.push(`switchChain ${JSON.stringify(args)}`),
  }),
  useReadContract: ({ functionName }: { functionName: ReadName }) => fakeRead(functionName),
  // One plans(token) read per candidate token; the fixture has one candidate.
  useReadContracts: () => {
    const toResults = (plan: Plan | null | undefined) =>
      plan === undefined ? undefined : [plan ? { status: "success", result: plan } : { status: "failure" }];
    const plans = fakeRead("plans");
    return {
      ...plans,
      data: toResults(fake.cache.plans),
      // Like react-query, a failed refetch keeps the last results.
      refetch: async () => {
        const { isError } = await plans.refetch();
        return { isError, data: toResults(fake.cache.plans) };
      },
    };
  },
  useWriteContract: () => ({
    isPending: false,
    writeContractAsync: async (variables: { functionName: string; args: [string, bigint] }) => {
      const { functionName, args } = variables;
      fake.approvals.push(variables);
      fake.events.push(`${functionName} signed ${args.join(" ")}`);
      if (fake.approveImpl) return fake.approveImpl();
      fake.pendingAllowance = args[1];
      return "0xapprove";
    },
  }),
}));

vi.mock("~~/hooks/scaffold-eth", () => ({
  useScaffoldReadContract: ({ functionName }: { functionName: ReadName }) => fakeRead(functionName),
  useDeployedContractInfo: () => ({
    data: fake.paywallCheck === "deployed" ? { address: PAYWALL } : undefined,
    isLoading: fake.paywallCheck === "loading",
  }),
  // Like useTransactor: waits for the receipt, toasts failures and rethrows them.
  useTransactor: () => async (tx: () => Promise<string>) => {
    if (!fake.walletClientReady) {
      fake.toasts.push(["error", "Cannot access account"]);
      return undefined;
    }
    try {
      const hash = await tx();
      await fake.mineApproval;
      fake.chain.allowance = fake.pendingAllowance ?? fake.chain.allowance;
      fake.events.push("approve mined");
      return hash;
    } catch (error) {
      fake.toasts.push(["error", (error as Error).message]);
      throw error;
    }
  },
  // Like useScaffoldWriteContract: simulates `pay` against the chain, then sends it and waits for the receipt.
  // The simulation charges the plan stored on chain, like TokenpingPaywall.pay.
  useScaffoldWriteContract: () => ({
    isPending: false,
    isMining: false,
    writeContractAsync: async ({ args }: { functionName: "pay"; args: [string] }) => {
      if (fake.payImpl) return fake.payImpl();
      const [price, , enabled] = fake.chain.plans ?? [0n, 0n, false];
      const revert = fake.chain.paused
        ? "EnforcedPause()"
        : price === 0n
          ? "Plan not set"
          : !enabled
            ? "Token not supported"
            : fake.chain.allowance < price
              ? "ERC20InsufficientAllowance"
              : undefined;
      if (revert) {
        fake.toasts.push(["error", revert]);
        throw new Error(revert);
      }
      fake.events.push(`pay sent ${args[0]}`);
      fake.chain.allowance -= price;
      fake.chain.isActive = true;
      return "0xpay";
    },
  }),
}));

vi.mock("~~/utils/scaffold-eth", () => ({
  notification: {
    success: (message: string) => fake.toasts.push(["success", message]),
    error: (message: string) => fake.toasts.push(["error", message]),
  },
}));

vi.mock("~~/constants/payments", async importOriginal => ({
  ...(await importOriginal<typeof import("~~/constants/payments")>()),
  get PAYMENT_CHAIN_ID() {
    return fake.paymentChainId;
  },
  PAYMENT_CONTRACT_ADDRESS: PAYWALL,
  PAYMENT_TOKEN_CANDIDATES: [TOKEN],
  PAYMENT_TOKEN_ADDRESS: TOKEN,
  PAYWALL_ABI: [],
}));

type Props = Partial<Parameters<typeof AccessPaywall>[0]>;

/** Pass the client of an earlier render to remount the paywall in the same page session. */
const renderPaywall = (props: Props = {}, queryClient?: QueryClient) =>
  renderWithProviders(<AccessPaywall {...props}>{<div>child</div>}</AccessPaywall>, { queryClient });

const html = (props: Props = {}) => renderPaywall(props).container.innerHTML;

const payButton = () => screen.getByRole("button", { name: /Pay for access|Extend access|Processing/ });

/** A connected wallet on the payment chain, with every read loaded and no allowance yet. */
const setReady = () => {
  fake.wallet = { address: USER, chainId: PAYMENT_CHAIN_ID };
  loadReads();
};

/** Clicks Pay and waits until the flow has finished (after a payment the paywall makes way for the children). */
const pay = async () => {
  fireEvent.click(payButton());
  await waitFor(() => expect(screen.queryByText("Processing...")).toBeNull());
};

beforeEach(() => {
  resetFake();
});

describe("AccessPaywall markup", () => {
  it("shows the expiry date and children when access is active", () => {
    setReady();
    fake.cache.isActive = true;
    fake.cache.expiryTimestampByUser = 1_800_000_000n;
    const date = new Date(1_800_000_000 * 1000).toLocaleDateString(undefined, { dateStyle: "medium" });
    const markup = html();
    expect(markup).toContain(date);
    expect(markup.replace(date, "<DATE>")).toMatchSnapshot();
  });

  it("hides the expiry line when the expiry timestamp is zero", () => {
    setReady();
    fake.cache.isActive = true;
    expect(html()).toMatchSnapshot();
  });

  it("asks to connect a wallet first", () => {
    expect(html()).toMatchSnapshot();
  });

  it("reports a missing payment contract after the wallet check", () => {
    fake.wallet.address = USER;
    fake.paymentChainId = undefined;
    expect(html()).toMatchSnapshot();
  });

  it("offers a network switch on the wrong chain", () => {
    fake.wallet = { address: USER, chainId: 1 };
    expect(html()).toMatchSnapshot();
  });

  it("treats an unknown wallet chain as the wrong chain", () => {
    fake.wallet.address = USER;
    expect(html()).toMatchSnapshot();
  });

  it.each([
    ["missing", null],
    ["disabled", [1_500_000n, 2_592_000n, false] as const],
  ])("reports no paid plan when the plan is %s", (_label, plan) => {
    fake.chain.plans = plan;
    setReady();
    expect(html()).toMatchSnapshot();
  });

  it("shows the price and an enabled pay button when ready", () => {
    setReady();
    expect(html()).toMatchSnapshot();
  });

  it("uses the extend copy for an existing config", () => {
    setReady();
    expect(html({ hasExistingConfig: true })).toMatchSnapshot();
  });

  it("lets the description prop override the default copy", () => {
    setReady();
    expect(html({ hasExistingConfig: true, description: "Custom copy" })).toMatchSnapshot();
  });

  // A plan without a payment token cannot come out of useAccess (plans are read per token); paywallStatus covers it.
  it("disables the pay button when the price is zero", () => {
    fake.chain.plans = [0n, 2_592_000n, true];
    setReady();
    expect(html()).toMatchSnapshot();
  });

  it("rounds the access duration to whole days with toFixed", () => {
    fake.chain.plans = [1_000_000_000n, 129_600n, true];
    setReady();
    expect(html()).toContain(
      '>1,000 USDC</span><span class="text-sm font-medium text-base-content/90 dark:text-gray-300">≈ 2 days access<',
    );
  });

  it("pairs every amber and emerald text shade with a light-theme shade", () => {
    const markups = [html()];
    fake.wallet = { address: USER, chainId: 1 };
    markups.push(html());
    setReady();
    fake.cache.isActive = true;
    fake.cache.expiryTimestampByUser = 1_800_000_000n;
    markups.push(html());
    const classes = markups.flatMap(markup => [...markup.matchAll(/class="([^"]*)"/g)].map(([, value]) => value));
    const textShades = classes.flatMap(value => value.split(" ")).filter(name => /^text-(amber|emerald)-/.test(name));
    // Connect wallet: icon + message; wrong chain: icon + switch button; active: expiry line.
    expect(textShades.sort()).toEqual([
      "text-amber-600",
      "text-amber-600",
      "text-amber-600",
      "text-amber-700",
      "text-emerald-600/90",
    ]);
    expect(classes.join(" ")).toContain("text-amber-600 dark:text-amber-400");
    expect(classes.join(" ")).toContain("text-amber-700 dark:text-amber-300");
    expect(classes.join(" ")).toContain("text-emerald-600/90 dark:text-emerald-400/80");
  });
});

describe("AccessPaywall payment readiness", () => {
  // Regression (B2.0): with an unknown allowance the paywall used to assume 0 and decide to approve.
  it("keeps Pay disabled until the allowance is known", () => {
    setReady();
    delete fake.cache.allowance;
    renderPaywall();
    expect(payButton().hasAttribute("disabled")).toBe(true);
    expect(screen.queryByText(/paused|payment status/)).toBeNull();
  });

  // Regression (B2.1): paused() was never read, so Pay stayed enabled and the approve was sent anyway.
  it("disables Pay and explains why while the paywall is paused", () => {
    fake.chain.paused = true;
    setReady();
    expect(html()).toMatchSnapshot();
    expect(payButton().hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Payments are paused right now. Try again later.")).toBeDefined();
  });

  it("keeps Pay disabled until paused() is known", () => {
    setReady();
    delete fake.cache.paused;
    renderPaywall();
    expect(payButton().hasAttribute("disabled")).toBe(true);
  });

  // Paying approves the paywall, so its code must be confirmed first; Pay used to be enabled and then refuse.
  it("keeps Pay disabled while the paywall deployment is being confirmed", () => {
    setReady();
    fake.paywallCheck = "loading";
    renderPaywall();
    expect(payButton().hasAttribute("disabled")).toBe(true);
    expect(screen.queryByText(/paused|payment status/)).toBeNull();
  });

  it("explains a paywall deployment that cannot be confirmed", () => {
    setReady();
    fake.paywallCheck = "missing";
    renderPaywall();
    expect(payButton().hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Could not load the payment status. Reload the page to try again.")).toBeDefined();
  });

  it.each(["allowance", "paused"] as const)("explains a failed %s read instead of waiting forever", name => {
    setReady();
    delete fake.cache[name];
    fake.failingReads.add(name);
    renderPaywall();
    expect(payButton().hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Could not load the payment status. Reload the page to try again.")).toBeDefined();
  });
});

describe("AccessPaywall actions", () => {
  it("switches to the payment chain", () => {
    fake.wallet = { address: USER, chainId: 1 };
    renderPaywall();
    fireEvent.click(screen.getByRole("button", { name: "Switch network" }));
    expect(fake.events).toEqual([`switchChain {"chainId":${PAYMENT_CHAIN_ID}}`]);
  });

  // Regression (B2.0): `pay` used to be simulated right after the wallet signed the approve, before it was mined.
  it("approves the exact price, waits for it to be mined, then pays and toasts success once", async () => {
    setReady();
    fake.chain.allowance = PRICE - 1n;
    loadReads("allowance");
    renderPaywall();
    await pay();
    expect(fake.events.slice(0, 7)).toEqual([
      "refetch plans",
      "refetch paused",
      "refetch allowance",
      `approve signed ${PAYWALL} ${PRICE}`,
      "approve mined",
      "refetch allowance",
      `pay sent ${TOKEN}`,
    ]);
    expect(fake.approvals).toEqual([
      { abi: erc20Abi, address: TOKEN, functionName: "approve", args: [PAYWALL, PRICE], chainId: PAYMENT_CHAIN_ID },
    ]);
    expect(fake.toasts).toEqual([["success", SUCCESS]]);
    expect(fake.chain.isActive).toBe(true);
  });

  it("refetches access, expiry and the allowance after paying", async () => {
    setReady();
    renderPaywall();
    await pay();
    const afterPay = fake.events.slice(fake.events.indexOf(`pay sent ${TOKEN}`) + 1);
    expect(afterPay).toEqual(
      expect.arrayContaining(["refetch isActive", "refetch expiryTimestampByUser", "refetch allowance"]),
    );
  });

  it("skips the approval when the allowance covers the price", async () => {
    setReady();
    fake.chain.allowance = PRICE;
    loadReads("allowance");
    renderPaywall();
    await pay();
    expect(fake.events.filter(event => !event.startsWith("refetch"))).toEqual([`pay sent ${TOKEN}`]);
    expect(fake.toasts).toEqual([["success", SUCCESS]]);
  });

  it("shows Processing... and disables Pay until the approval is mined and paid", async () => {
    setReady();
    const mined = deferred<void>();
    fake.mineApproval = mined.promise;
    const { container } = renderPaywall();
    fireEvent.click(payButton());
    await waitFor(() => expect(fake.events).toContain(`approve signed ${PAYWALL} ${PRICE}`));
    expect(payButton().textContent).toBe("Processing...");
    expect(payButton().hasAttribute("disabled")).toBe(true);
    expect(container.innerHTML).toMatchSnapshot();
    mined.resolve();
    await waitFor(() => expect(fake.toasts).toEqual([["success", SUCCESS]]));
  });

  // Regression (B2.1): a pause after the page loaded must also stop the approve.
  it("re-checks paused() before approving and sends nothing once paused", async () => {
    setReady();
    renderPaywall();
    fake.chain.paused = true;
    await pay();
    expect(fake.events).toEqual(["refetch plans", "refetch paused", "refetch allowance"]);
    expect(fake.toasts).toEqual([["error", "Payments are paused right now. Try again later."]]);
  });

  // A failed refetch keeps the last value, so a cached `false` / allowance must not pass for a fresh read.
  it.each(["paused", "allowance"] as const)("sends nothing when re-reading %s fails at click time", async name => {
    setReady();
    renderPaywall();
    fake.failingReads.add(name);
    await pay();
    expect(fake.events.filter(event => !event.startsWith("refetch"))).toEqual([]);
    expect(fake.toasts).toEqual([["error", "Could not check the payment status. Try again in a moment."]]);
  });

  // Regression (B2.0): a retry decided from the allowance cached by the lagging read, and approved a second time.
  it("does not approve again on a retry once the confirmed approval shows up", async () => {
    setReady();
    fake.staleAllowanceReads = 1;
    renderPaywall();
    await pay();
    expect(fake.toasts).toEqual([["error", "The approval is confirmed but not visible yet. Try again in a moment."]]);
    expect(fake.events).not.toContain(`pay sent ${TOKEN}`);
    await pay();
    expect(fake.events.filter(event => event.startsWith("approve signed"))).toHaveLength(1);
    expect(fake.events).toContain(`pay sent ${TOKEN}`);
    expect(fake.toasts.at(-1)).toEqual(["success", SUCCESS]);
  });

  // Reporting success before isActive was refetched left an enabled Pay button next to the toast.
  it("keeps Processing... until access is refetched, then swaps to the children with the toast", async () => {
    setReady();
    fake.chain.allowance = PRICE;
    loadReads("allowance");
    const accessRefetched = deferred<void>();
    fake.refetchGates.isActive = accessRefetched.promise;
    renderPaywall();
    fireEvent.click(payButton());
    await waitFor(() => expect(fake.events).toContain("refetch isActive"));
    await Promise.resolve();
    expect(fake.toasts).toEqual([]);
    expect(payButton().textContent).toBe("Processing...");
    expect(payButton().hasAttribute("disabled")).toBe(true);
    accessRefetched.resolve();
    await waitFor(() => expect(fake.toasts).toEqual([["success", SUCCESS]]));
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("child")).toBeDefined();
  });

  it("leaves a failed approval to the SE-2 transactor toast and does not pay", async () => {
    setReady();
    fake.approveImpl = () => Promise.reject(new Error("User rejected the request."));
    renderPaywall();
    await pay();
    expect(fake.toasts).toEqual([["error", "User rejected the request."]]);
    expect(fake.events.some(event => event.startsWith("pay sent"))).toBe(false);
  });

  it("does not pay when the approval could not be sent (no wallet client yet)", async () => {
    setReady();
    fake.walletClientReady = false;
    renderPaywall();
    await pay();
    expect(fake.toasts).toEqual([["error", "Cannot access account"]]);
    expect(fake.events.some(event => event.startsWith("pay sent"))).toBe(false);
  });

  // Regression (I4): a failed `pay` simulation used to be toasted twice, by SE-2 and by the paywall.
  it("leaves a failed pay simulation to the SE-2 toast", async () => {
    setReady();
    fake.chain.allowance = PRICE;
    loadReads("allowance");
    renderPaywall();
    fake.chain.paused = false;
    fake.payImpl = async () => {
      fake.toasts.push(["error", "Token not supported"]);
      throw new Error("Token not supported");
    };
    await pay();
    expect(fake.toasts).toEqual([["error", "Token not supported"]]);
  });

  // Regression (B2.2): `pay` resolving undefined (nothing sent; SE-2 already said why) used to toast success.
  it("does not toast success when the pay write resolves undefined", async () => {
    setReady();
    fake.chain.allowance = PRICE;
    loadReads("allowance");
    fake.payImpl = async () => {
      fake.toasts.push(["error", "Please connect your wallet"]);
      return undefined;
    };
    renderPaywall();
    await pay();
    expect(fake.toasts).toEqual([["error", "Please connect your wallet"]]);
  });
});

describe("AccessPaywall fresh plan", () => {
  const RAISED_PRICE = 2_000_000n;

  // Regression (F7): the approve used the plan cached at page load, so after a price rise it approved the old price,
  // `pay` reverted, and every retry skipped the approve (allowance >= the old price) and reverted again.
  it("approves and pays the price read at click time, not the one cached at render", async () => {
    setReady();
    fake.chain.allowance = PRICE;
    loadReads("allowance");
    renderPaywall();
    fake.chain.plans = [RAISED_PRICE, 2_592_000n, true];
    await pay();
    expect(fake.events.slice(0, 7)).toEqual([
      "refetch plans",
      "refetch paused",
      "refetch allowance",
      `approve signed ${PAYWALL} ${RAISED_PRICE}`,
      "approve mined",
      "refetch allowance",
      `pay sent ${TOKEN}`,
    ]);
    expect(fake.toasts).toEqual([["success", SUCCESS]]);
  });

  it("skips the approval when the allowance covers the price read at click time", async () => {
    setReady();
    fake.chain.allowance = PRICE;
    loadReads("allowance");
    renderPaywall();
    fake.chain.plans = [PRICE - 1n, 2_592_000n, true];
    await pay();
    expect(fake.events.filter(event => !event.startsWith("refetch"))).toEqual([`pay sent ${TOKEN}`]);
  });

  // Regression (F7): a plan disabled after the page loaded still got an approve (wasted gas) before `pay` reverted.
  it.each([
    ["disabled", [PRICE, 2_592_000n, false] as const],
    ["priced at zero", [0n, 2_592_000n, true] as const],
    ["removed", null],
  ])("sends nothing when the plan was %s after the page loaded", async (_label, plan) => {
    setReady();
    renderPaywall();
    fake.chain.plans = plan;
    await pay();
    expect(fake.events).toEqual(["refetch plans", "refetch paused", "refetch allowance"]);
    expect(fake.toasts).toEqual([["error", UNAVAILABLE]]);
  });

  // A failed refetch keeps the last value, so the cached plan must not pass for a fresh read.
  it("sends nothing when re-reading the plan fails at click time", async () => {
    setReady();
    renderPaywall();
    fake.failingReads.add("plans");
    await pay();
    expect(fake.events.filter(event => !event.startsWith("refetch"))).toEqual([]);
    expect(fake.toasts).toEqual([["error", UNAVAILABLE]]);
  });
});

describe("AccessPaywall after a payment", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  /** The isActive reads since `pay` was sent. */
  const accessReadsAfterPay = () =>
    fake.events.slice(fake.events.indexOf(`pay sent ${TOKEN}`)).filter(event => event === "refetch isActive").length;

  /** Runs due timers and settles the promises they start, inside act so React applies the state updates. */
  const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

  // Regression (F8): one stale isActive read after the receipt toasted "Access active" next to an enabled Pay button.
  it("re-reads isActive every 2 seconds until it shows the payment, then toasts success", async () => {
    vi.useFakeTimers();
    setReady();
    fake.staleActiveReads = 2;
    renderPaywall();
    fireEvent.click(payButton());
    await advance(0);
    expect(accessReadsAfterPay()).toBe(1);
    expect(payButton().textContent).toBe("Processing...");
    await advance(1_999);
    expect(accessReadsAfterPay()).toBe(1);
    await advance(1);
    expect(accessReadsAfterPay()).toBe(2);
    expect(fake.toasts).toEqual([]);
    await advance(2_000);
    expect(accessReadsAfterPay()).toBe(3);
    expect(fake.toasts).toEqual([["success", SUCCESS]]);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("child")).toBeDefined();
  });

  it("gives up after 5 reads, keeps Pay disabled with a pending notice and never toasts 'Access active'", async () => {
    vi.useFakeTimers();
    setReady();
    fake.staleActiveReads = Number.POSITIVE_INFINITY;
    renderPaywall();
    fireEvent.click(payButton());
    await advance(60_000);
    expect(accessReadsAfterPay()).toBe(5);
    expect(fake.toasts).toEqual([["success", PENDING]]);
    expect(screen.getByText(PENDING)).toBeDefined();
    expect(payButton().textContent).toBe("Pay for access (USDC)");
    expect(payButton().hasAttribute("disabled")).toBe(true);
    const eventsBefore = fake.events.length;
    fireEvent.click(payButton());
    await advance(60_000);
    expect(fake.events.length).toBe(eventsBefore);
  });

  // isActive is watched every block, and a lagging node can answer one of those reads with false again.
  it("does not offer Pay again in this session when isActive reads false after a confirmed payment", async () => {
    setReady();
    const { rerender } = renderPaywall();
    await pay();
    expect(fake.toasts).toEqual([["success", SUCCESS]]);
    fake.cache.isActive = false;
    rerender(<AccessPaywall>{<div>child</div>}</AccessPaywall>);
    expect(payButton().hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(PENDING)).toBeDefined();
  });

  it("shows the pending notice instead of the paused notice after a payment", async () => {
    vi.useFakeTimers();
    setReady();
    fake.staleActiveReads = Number.POSITIVE_INFINITY;
    const { rerender } = renderPaywall();
    fireEvent.click(payButton());
    await advance(60_000);
    fake.cache.paused = true;
    fake.chain.paused = true;
    // The fake reads are not reactive: a rerender is what hands the paused read to the paywall.
    rerender(<AccessPaywall>{<div>child</div>}</AccessPaywall>);
    expect(screen.getByText(PENDING)).toBeDefined();
    expect(screen.queryByText("Payments are paused right now. Try again later.")).toBeNull();
  });

  it("offers Pay again for a different wallet, and not when the wallet that paid comes back", async () => {
    vi.useFakeTimers();
    setReady();
    fake.staleActiveReads = Number.POSITIVE_INFINITY;
    const { rerender } = renderPaywall();
    fireEvent.click(payButton());
    await advance(60_000);
    expect(payButton().hasAttribute("disabled")).toBe(true);
    fake.wallet = { address: "0x2222222222222222222222222222222222222222", chainId: PAYMENT_CHAIN_ID };
    rerender(<AccessPaywall>{<div>child</div>}</AccessPaywall>);
    expect(payButton().hasAttribute("disabled")).toBe(false);
    expect(screen.queryByText(PENDING)).toBeNull();
    fake.wallet = { address: USER, chainId: PAYMENT_CHAIN_ID };
    rerender(<AccessPaywall>{<div>child</div>}</AccessPaywall>);
    expect(payButton().hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(PENDING)).toBeDefined();
  });

  // Regression: the lock was component state, so Refresh (which swaps the position details, paywall included, for a
  // skeleton) handed the wallet that had just paid an enabled Pay button again while isActive still read false.
  it("keeps Pay disabled for the wallet that paid after the paywall remounts", async () => {
    vi.useFakeTimers();
    setReady();
    fake.staleActiveReads = Number.POSITIVE_INFINITY;
    // The app's client keeps react-query's default 5-minute gcTime for unobserved queries.
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { unmount } = renderPaywall({}, queryClient);
    fireEvent.click(payButton());
    await advance(60_000);
    expect(payButton().hasAttribute("disabled")).toBe(true);
    unmount();
    await advance(60 * 60_000);
    renderPaywall({}, queryClient);
    expect(payButton().hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(PENDING)).toBeDefined();
    const eventsBefore = fake.events.length;
    fireEvent.click(payButton());
    await advance(60_000);
    expect(fake.events.length).toBe(eventsBefore);
    queryClient.clear();
  });
});
