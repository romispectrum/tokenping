// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { erc20Abi } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessPaywall } from "~~/components/custom/AccessPaywall";
import { deferred } from "~~/utils/testing/helpers";

// Hoisted: useAccess reads the payment constants (mocked below) as soon as it is imported.
const { PAYWALL, TOKEN } = vi.hoisted(() => ({
  PAYWALL: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  TOKEN: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
}));
const USER = "0x1111111111111111111111111111111111111111";
const PAYMENT_CHAIN_ID = 42161;
const PRICE = 1_500_000n;
const SUCCESS = "Access active. You can now configure notifications.";

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
  useReadContracts: () => {
    const plans = fakeRead("plans");
    const plan = fake.cache.plans;
    return {
      ...plans,
      data: plan === undefined ? undefined : [plan ? { status: "success", result: plan } : { status: "failure" }],
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
  useScaffoldWriteContract: () => ({
    isPending: false,
    isMining: false,
    writeContractAsync: async ({ args }: { functionName: "pay"; args: [string] }) => {
      if (fake.payImpl) return fake.payImpl();
      const revert = fake.chain.paused
        ? "EnforcedPause()"
        : fake.chain.allowance < PRICE
          ? "ERC20InsufficientAllowance"
          : undefined;
      if (revert) {
        fake.toasts.push(["error", revert]);
        throw new Error(revert);
      }
      fake.events.push(`pay sent ${args[0]}`);
      fake.chain.allowance -= PRICE;
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

const renderPaywall = (props: Props = {}) => render(<AccessPaywall {...props}>{<div>child</div>}</AccessPaywall>);

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
    expect(fake.events.slice(0, 6)).toEqual([
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
    expect(fake.events).toEqual(["refetch paused", "refetch allowance"]);
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
