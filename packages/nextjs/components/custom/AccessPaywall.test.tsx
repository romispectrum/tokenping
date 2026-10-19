// @vitest-environment jsdom
import { QueryClient, useMutation } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { erc20Abi } from "viem";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccessPaywall } from "~~/components/custom/AccessPaywall";
import { LocaleProvider } from "~~/i18n/LocaleProvider";
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
const PENDING = "Payment confirmed. Access will appear shortly.";
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
  // Like wagmi: each wallet request is a react-query mutation under the ["writeContract"] key, pending until the
  // wallet answers and holding the hash after. The paywall reads its step-by-step progress from these.
  useWriteContract: () => {
    const { isPending, mutateAsync } = useMutation({
      mutationKey: ["writeContract"],
      mutationFn: async (variables: { functionName: string; args: [string, bigint] }) => {
        const { functionName, args } = variables;
        fake.approvals.push(variables);
        fake.events.push(`${functionName} signed ${args.join(" ")}`);
        if (fake.approveImpl) return fake.approveImpl();
        fake.pendingAllowance = args[1];
        return "0xapprove";
      },
    });
    return { isPending, writeContractAsync: mutateAsync };
  },
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
  // The SE-2 hook signs through wagmi's useWriteContract, so `pay` is a ["writeContract"] mutation too.
  useScaffoldWriteContract: () => {
    const { isPending, mutateAsync } = useMutation({
      mutationKey: ["writeContract"],
      mutationFn: async ({ args }: { functionName: "pay"; args: [string] }) => {
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
    });
    return { isPending, isMining: false, writeContractAsync: mutateAsync };
  },
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

// useId values depend on how many roots rendered before, so they are masked to keep snapshots order-independent.
const html = (props: Props = {}) => renderPaywall(props).container.innerHTML.replace(/_r_[0-9a-z]+_/g, "«id»");

// Its name is the label, or the loading label while the flow runs (the hidden label keeps the width).
const payButton = () =>
  screen.getByRole("button", { name: /^(Pay [\d,.]+ USDC|Processing|Waiting for your wallet|Approving|Paying)$/ });

/** A loading button keeps its focus and colour: aria-busy and aria-disabled, not disabled. */
const isBusy = (button: HTMLElement) =>
  button.getAttribute("aria-busy") === "true" && button.getAttribute("aria-disabled") === "true";

/** A blocked button stays in the tab order so its reason can be reached: aria-disabled without aria-busy, never disabled. */
const isBlocked = (button: HTMLElement) =>
  button.getAttribute("aria-disabled") === "true" &&
  !button.hasAttribute("aria-busy") &&
  !button.hasAttribute("disabled");

/** A connected wallet on the payment chain, with every read loaded and no allowance yet. */
const setReady = () => {
  fake.wallet = { address: USER, chainId: PAYMENT_CHAIN_ID };
  loadReads();
};

/** Clicks Pay and waits until the flow has finished (after a payment the paywall makes way for the children). */
const pay = async () => {
  fireEvent.click(payButton());
  await waitFor(() => expect(screen.queryByRole("button", { busy: true })).toBeNull());
};

beforeEach(() => {
  resetFake();
});

describe("AccessPaywall markup", () => {
  it("shows the expiry date and children when access is active", () => {
    setReady();
    fake.cache.isActive = true;
    fake.cache.expiryTimestampByUser = 1_800_000_000n;
    const date = new Date(1_800_000_000 * 1000).toLocaleDateString("en-US", { dateStyle: "medium" });
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

  it("rounds the access duration to whole days with toFixed, and says when it rounded", () => {
    fake.chain.plans = [1_000_000_000n, 129_600n, true];
    setReady();
    const markup = html();
    expect(markup).toContain('<span class="font-bold tabular-nums">1,000</span>');
    expect(markup).toContain('<dd class="m-0 text-right text-foreground">About 2 days</dd>');
  });

  it("states a whole number of days exactly", () => {
    setReady();
    expect(html()).toContain('<dd class="m-0 text-right text-foreground">30 days</dd>');
  });

  it("shows both wallet steps, the network and the fee currency before anything opens the wallet", () => {
    setReady();
    renderPaywall();
    const steps = screen.getByRole("list", { name: "Payment steps" });
    expect([...steps.querySelectorAll("li")].map(step => step.textContent)).toEqual([
      // the step number, the step, the hint
      "1Approve 1.5 USDCLets the paywall take exactly this amount. Skipped when an earlier approval covers it.",
      "2Pay 1.5 USDCSends the payment and unlocks alerts.",
    ]);
    expect(screen.getByText("Network").nextElementSibling?.textContent).toBe("Arbitrum One");
    expect(screen.getByText("Paid in ETH for each step, shown in your wallet")).toBeDefined();
  });

  // Theme tokens switch with light and dark; palette shades and hex values do not.
  it("styles every state with theme tokens only, and spends the view's one pink on its single action", () => {
    const markups = [html()];
    fake.wallet = { address: USER, chainId: 1 };
    markups.push(html());
    setReady();
    markups.push(html());
    fake.cache.isActive = true;
    fake.cache.expiryTimestampByUser = 1_800_000_000n;
    markups.push(html());
    const classes = markups.flatMap(markup => [...markup.matchAll(/class="([^"]*)"/g)].map(([, value]) => value));
    const paletteColour =
      /(^|:)(text|bg|border|from|via|to|shadow)-(amber|emerald|red|gray|orange|sky|purple|indigo|white|black)\b/;

    expect(classes.flatMap(value => value.split(" ")).filter(name => paletteColour.test(name))).toEqual([]);
    expect(markups.join("")).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    // en and em dash, built from their code points
    expect(markups.join("")).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
    // Connect wallet: no button; wrong chain: Switch; ready: Pay; active: none (paying ahead is an outline button).
    expect(markups.map(markup => markup.split("btn-primary").length - 1)).toEqual([0, 1, 1, 0]);
  });

  it("names the unlocked state with an icon and words", () => {
    setReady();
    fake.cache.isActive = true;
    fake.cache.expiryTimestampByUser = 1_800_000_000n;
    renderPaywall();
    expect(screen.getByText(/^Alerts unlocked until/)).toBeDefined();
  });
});

describe("AccessPaywall payment readiness", () => {
  // Regression (B2.0): with an unknown allowance the paywall used to assume 0 and decide to approve.
  it("keeps Pay disabled until the allowance is known", () => {
    setReady();
    delete fake.cache.allowance;
    renderPaywall();
    expect(isBlocked(payButton())).toBe(true);
    expect(screen.queryByText(/paused|payment status/)).toBeNull();
  });

  // Regression (B2.1): paused() was never read, so Pay stayed enabled and the approve was sent anyway.
  it("disables Pay and explains why while the paywall is paused", () => {
    fake.chain.paused = true;
    setReady();
    expect(html()).toMatchSnapshot();
    expect(isBlocked(payButton())).toBe(true);
    expect(screen.getByText("Payments are paused right now. Try again later.")).toBeDefined();
  });

  it("keeps Pay disabled until paused() is known", () => {
    setReady();
    delete fake.cache.paused;
    renderPaywall();
    expect(isBlocked(payButton())).toBe(true);
  });

  // Paying approves the paywall, so its code must be confirmed first; Pay used to be enabled and then refuse.
  it("keeps Pay disabled while the paywall deployment is being confirmed", () => {
    setReady();
    fake.paywallCheck = "loading";
    renderPaywall();
    expect(isBlocked(payButton())).toBe(true);
    expect(screen.queryByText(/paused|payment status/)).toBeNull();
  });

  it("explains a paywall deployment that cannot be confirmed", () => {
    setReady();
    fake.paywallCheck = "missing";
    renderPaywall();
    expect(isBlocked(payButton())).toBe(true);
    expect(screen.getByText("Could not load the payment status. Reload the page to try again.")).toBeDefined();
  });

  // A disabled button leaves the tab order, so keyboard and screen reader users never reached the reason beside it.
  it("keeps a blocked Pay focusable, describes it with the reason, and ignores clicks", () => {
    fake.chain.paused = true;
    setReady();
    renderPaywall();
    const button = payButton();
    button.focus();

    expect(isBlocked(button)).toBe(true);
    expect(document.activeElement).toBe(button);
    expect(document.getElementById(button.getAttribute("aria-describedby")!)?.textContent).toBe(
      "Payments are paused right now. Try again later.",
    );
    expect(button.className).toContain("aria-disabled:opacity-50");
    const eventsBefore = fake.events.length;
    fireEvent.click(button);
    expect(fake.events.length).toBe(eventsBefore);
  });

  it.each(["allowance", "paused"] as const)("explains a failed %s read instead of waiting forever", name => {
    setReady();
    delete fake.cache[name];
    fake.failingReads.add(name);
    renderPaywall();
    expect(isBlocked(payButton())).toBe(true);
    expect(screen.getByText("Could not load the payment status. Reload the page to try again.")).toBeDefined();
  });
});

describe("AccessPaywall actions", () => {
  it("switches to the payment chain", () => {
    fake.wallet = { address: USER, chainId: 1 };
    renderPaywall();
    fireEvent.click(screen.getByRole("button", { name: "Switch to Arbitrum One" }));
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

  it("keeps Pay busy and focused, and ignores clicks, until the approval is mined and paid", async () => {
    setReady();
    const mined = deferred<void>();
    fake.mineApproval = mined.promise;
    const { container } = renderPaywall();
    payButton().focus();
    fireEvent.click(payButton());
    await waitFor(() => expect(fake.events).toContain(`approve signed ${PAYWALL} ${PRICE}`));
    await waitFor(() => expect(payButton().getAttribute("aria-busy")).toBe("true"));
    expect(isBusy(payButton())).toBe(true);
    expect(payButton().hasAttribute("disabled")).toBe(false);
    expect(document.activeElement).toBe(payButton());
    const eventsBefore = fake.events.length;
    fireEvent.click(payButton());
    expect(fake.events.length).toBe(eventsBefore);
    expect(container.innerHTML.replace(/_r_[0-9a-z]+_/g, "«id»")).toMatchSnapshot();
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
  it("keeps Pay busy until access is refetched, then swaps to the children with the toast", async () => {
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
    expect(isBusy(payButton())).toBe(true);
    accessRefetched.resolve();
    await waitFor(() => expect(fake.toasts).toEqual([["success", SUCCESS]]));
    // The Pay flow made way for the children; only the outline "pay ahead" button remains.
    expect(screen.queryByRole("button", { name: /^Pay / })).toBeNull();
    expect(screen.getByRole("button", { name: "Add 30 days for 1.5 USDC" })).toBeDefined();
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

describe("AccessPaywall paying ahead", () => {
  const EXPIRY = 1_800_000_000n;
  const PERIOD = 2_592_000n;
  const day = (timestamp: bigint) =>
    new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", { dateStyle: "medium" });
  const extendButton = () =>
    screen.getByRole("button", {
      name: /^(Add 30 days for 1\.5 USDC|Processing|Waiting for your wallet|Approving|Paying)$/,
    });
  const extend = async () => {
    fireEvent.click(extendButton());
    await waitFor(() => expect(screen.queryByRole("button", { busy: true })).toBeNull());
  };
  const setActive = () => {
    setReady();
    fake.chain.isActive = true;
    fake.chain.expiryTimestampByUser = EXPIRY;
    loadReads();
  };

  it("offers one more period while access is active, as an outline button with the hint, next to the children", () => {
    setActive();
    renderPaywall();
    const button = extendButton();
    expect(button.className).not.toContain("btn-primary");
    expect(button.className).toContain("border-input");
    expect(button.getAttribute("aria-describedby")).toBeTruthy();
    expect(document.getElementById(button.getAttribute("aria-describedby") as string)?.textContent).toBe(
      "Each payment adds 30 days after your current end date. Pay as many times as you like; nothing renews on its own.",
    );
    expect(screen.getByText(`Alerts unlocked until ${day(EXPIRY)}`)).toBeDefined();
    expect(screen.getByText("child")).toBeDefined();
  });

  it("pays the plan again, approving the exact price, and shows the new end date at once", async () => {
    setActive();
    renderPaywall();
    await extend();

    expect(fake.events.filter(event => /signed|pay sent/.test(event))).toEqual([
      `approve signed ${PAYWALL} ${PRICE}`,
      `pay sent ${TOKEN}`,
    ]);
    // The expiry read still returns the old date, like a lagging node: the card shows the contract's new one anyway.
    expect(fake.chain.expiryTimestampByUser).toBe(EXPIRY);
    expect(screen.getByText(`Alerts unlocked until ${day(EXPIRY + PERIOD)}`)).toBeDefined();
    expect(fake.toasts).toEqual([["success", `Access extended until ${day(EXPIRY + PERIOD)}.`]]);
  });

  it("adds one period per payment, as often as the user pays", async () => {
    setActive();
    renderPaywall();
    await extend();
    await extend();
    expect(fake.events.filter(event => event.startsWith("pay sent"))).toHaveLength(2);
    expect(screen.getByText(`Alerts unlocked until ${day(EXPIRY + 2n * PERIOD)}`)).toBeDefined();
  });

  it("shows the end date the chain reports once it is later than the one worked out", () => {
    setActive();
    fake.cache.expiryTimestampByUser = EXPIRY + 3n * PERIOD;
    renderPaywall();
    expect(screen.getByText(`Alerts unlocked until ${day(EXPIRY + 3n * PERIOD)}`)).toBeDefined();
  });

  it("offers a network switch instead while the wallet is on another network", () => {
    setActive();
    fake.wallet.chainId = 1;
    renderPaywall();
    fireEvent.click(screen.getByRole("button", { name: /^Switch to / }));
    expect(fake.events).toContain(`switchChain {"chainId":${PAYMENT_CHAIN_ID}}`);
    expect(screen.queryByRole("button", { name: /^Add / })).toBeNull();
  });

  it("blocks the button and says why while the paywall is paused", () => {
    setActive();
    fake.chain.paused = true;
    loadReads("paused");
    renderPaywall();
    const button = extendButton();
    expect(isBlocked(button)).toBe(true);
    fireEvent.click(button);
    expect(fake.events.filter(event => /signed|pay sent/.test(event))).toEqual([]);
  });

  it("writes the button and the hint in Czech", () => {
    setActive();
    renderWithProviders(
      <LocaleProvider locale="cs">
        <AccessPaywall>
          <div>child</div>
        </AccessPaywall>
      </LocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "Přidat 30 dní za 1.5 USDC" })).toBeDefined();
    expect(
      screen.getByText(
        "Každá platba přidá 30 dní k datu, kdy vám přístup končí. Platit můžete, kolikrát chcete; nic se neobnovuje samo.",
      ),
    ).toBeDefined();
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
    expect(isBusy(payButton())).toBe(true);
    await advance(1_999);
    expect(accessReadsAfterPay()).toBe(1);
    await advance(1);
    expect(accessReadsAfterPay()).toBe(2);
    expect(fake.toasts).toEqual([]);
    await advance(2_000);
    expect(accessReadsAfterPay()).toBe(3);
    expect(fake.toasts).toEqual([["success", SUCCESS]]);
    // The Pay flow made way for the children; only the outline "pay ahead" button remains.
    expect(screen.queryByRole("button", { name: /^Pay / })).toBeNull();
    expect(screen.getByRole("button", { name: "Add 30 days for 1.5 USDC" })).toBeDefined();
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
    expect(payButton().textContent).toBe("Pay 1.5 USDC");
    expect(isBlocked(payButton())).toBe(true);
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
    expect(isBlocked(payButton())).toBe(true);
    expect(screen.getByText(PENDING)).toBeDefined();
    // The blocked Pay points at the notice that says why.
    expect(document.getElementById(payButton().getAttribute("aria-describedby")!)?.textContent).toBe(PENDING);
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
    expect(isBlocked(payButton())).toBe(true);
    fake.wallet = { address: "0x2222222222222222222222222222222222222222", chainId: PAYMENT_CHAIN_ID };
    rerender(<AccessPaywall>{<div>child</div>}</AccessPaywall>);
    expect(isBlocked(payButton())).toBe(false);
    expect(screen.queryByText(PENDING)).toBeNull();
    fake.wallet = { address: USER, chainId: PAYMENT_CHAIN_ID };
    rerender(<AccessPaywall>{<div>child</div>}</AccessPaywall>);
    expect(isBlocked(payButton())).toBe(true);
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
    expect(isBlocked(payButton())).toBe(true);
    unmount();
    await advance(60 * 60_000);
    renderPaywall({}, queryClient);
    expect(isBlocked(payButton())).toBe(true);
    expect(screen.getByText(PENDING)).toBeDefined();
    const eventsBefore = fake.events.length;
    fireEvent.click(payButton());
    await advance(60_000);
    expect(fake.events.length).toBe(eventsBefore);
    queryClient.clear();
  });
});

describe("AccessPaywall transaction lifecycle", () => {
  /** The persistent polite region that narrates the payment. */
  const lifecycle = () => document.querySelector<HTMLElement>('[role="status"][aria-atomic="true"]')!;
  const steps = () => within(screen.getByRole("list", { name: "Payment steps" })).getAllByRole("listitem");

  it("walks through approve and pay: wallet prompt, on-chain processing with an explorer link, then the next step", async () => {
    setReady();
    const approveSigned = deferred<void>();
    fake.approveImpl = async () => {
      await approveSigned.promise;
      fake.pendingAllowance = PRICE;
      return "0xapprove";
    };
    const approveMined = deferred<void>();
    fake.mineApproval = approveMined.promise;
    const paySigned = deferred<void>();
    fake.payImpl = async () => {
      await paySigned.promise;
      fake.chain.isActive = true;
      return "0xpay";
    };
    const accessRead = deferred<void>();
    fake.refetchGates.isActive = accessRead.promise;
    renderPaywall();
    expect(lifecycle().textContent).toBe("");

    fireEvent.click(payButton());
    await waitFor(() => expect(lifecycle().getAttribute("data-step")).toBe("approve-sign"));
    expect(lifecycle().textContent).toBe(
      "Confirm in your walletStep 1 of 2: approve 1.5 USDC. Nothing is sent until you confirm.",
    );
    expect(screen.getByRole("button", { name: "Waiting for your wallet" })).toBeDefined();
    expect(steps()[0].getAttribute("aria-current")).toBe("step");

    approveSigned.resolve();
    await waitFor(() => expect(lifecycle().getAttribute("data-step")).toBe("approve-pending"));
    expect(lifecycle().textContent).toContain("Processing on Arbitrum One");
    expect(
      within(lifecycle())
        .getByRole("link", { name: /View on Arbiscan/ })
        .getAttribute("href"),
    ).toBe("https://arbiscan.io/tx/0xapprove");
    expect(screen.getByRole("button", { name: "Approving" })).toBeDefined();

    approveMined.resolve();
    await waitFor(() => expect(lifecycle().getAttribute("data-step")).toBe("pay-sign"));
    expect(lifecycle().textContent).toContain("Step 2 of 2: pay 1.5 USDC. Nothing is sent until you confirm.");
    expect(within(steps()[0]).getByText("Done")).toBeDefined();
    expect(steps()[1].getAttribute("aria-current")).toBe("step");

    paySigned.resolve();
    await waitFor(() => expect(lifecycle().getAttribute("data-step")).toBe("pay-pending"));
    expect(
      within(lifecycle())
        .getByRole("link", { name: /View on Arbiscan/ })
        .getAttribute("href"),
    ).toBe("https://arbiscan.io/tx/0xpay");
    expect(screen.getByRole("button", { name: "Paying" })).toBeDefined();

    accessRead.resolve();
    await waitFor(() => expect(fake.toasts).toEqual([["success", SUCCESS]]));
    expect(screen.getByText("child")).toBeDefined();
  });

  it("marks the approval as not needed when the allowance already covers the price", async () => {
    setReady();
    fake.chain.allowance = PRICE;
    loadReads("allowance");
    const paySigned = deferred<void>();
    fake.payImpl = async () => {
      await paySigned.promise;
      fake.chain.isActive = true;
      return "0xpay";
    };
    renderPaywall();

    fireEvent.click(payButton());
    await waitFor(() => expect(lifecycle().getAttribute("data-step")).toBe("pay-sign"));
    expect(within(steps()[0]).getByText("Not needed")).toBeDefined();
    expect(fake.approvals).toEqual([]);

    paySigned.resolve();
    await waitFor(() => expect(fake.toasts).toEqual([["success", SUCCESS]]));
  });

  it("goes quiet again after a failed attempt, without claiming success", async () => {
    setReady();
    fake.approveImpl = () => Promise.reject(new Error("User rejected the request."));
    renderPaywall();

    await pay();
    expect(lifecycle().textContent).toBe("");
    expect(lifecycle().hasAttribute("data-step")).toBe(false);
    expect(payButton().textContent).toBe("Pay 1.5 USDC");
  });
});

describe("AccessPaywall in Czech", () => {
  const renderCzech = (props: Props = {}) =>
    renderWithProviders(
      <LocaleProvider locale="cs">
        <AccessPaywall {...props}>{<div>child</div>}</AccessPaywall>
      </LocaleProvider>,
    );
  const czechText = (props: Props = {}) => renderCzech(props).container.textContent ?? "";
  const czechPayButton = () => screen.getByRole("button", { name: /^Zaplatit [\d,.]+ USDC$/ });
  const NO_DASH = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);

  it("dates the unlocked state in the Czech format", () => {
    setReady();
    fake.cache.isActive = true;
    fake.cache.expiryTimestampByUser = 1_800_000_000n;
    const date = new Date(1_800_000_000 * 1000).toLocaleDateString("cs-CZ", { dateStyle: "medium" });

    expect(czechText()).toContain(`Upozornění odemčena do ${date}`);
  });

  it.each<[string, () => void, string]>([
    ["no wallet", () => undefined, "Připojte peněženku, abyste mohli za přístup zaplatit."],
    [
      "no payment contract",
      () => {
        fake.wallet.address = USER;
        fake.paymentChainId = undefined;
      },
      "Platební kontrakt pro tuto síť není nastavený.",
    ],
    [
      "no plan",
      () => {
        fake.chain.plans = null;
        setReady();
      },
      "Momentálně není k dispozici žádný placený tarif.",
    ],
  ])("explains %s in Czech", (_label, setUp, message) => {
    setUp();
    expect(czechText()).toContain(message);
  });

  it("asks for the payment network in Czech on the wrong chain", () => {
    fake.wallet = { address: USER, chainId: 1 };
    renderCzech();

    expect(screen.getByText("Nesprávná síť")).toBeDefined();
    expect(
      screen.getByText("Vaše peněženka je na jiné síti. Pro zaplacení přepněte na síť Arbitrum One."),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Přepnout na síť Arbitrum One" })).toBeDefined();
  });

  it("shows the plan, the steps and Pay in Czech, with the amount in the app's number format", () => {
    setReady();
    const text = czechText();

    expect(text).toContain("Odemkněte upozornění na health factor");
    expect(text).toContain("Zaplaťte jednou a odemkne se nastavení upozornění");
    for (const label of ["Cena", "Přístup", "30 dní", "Síť", "Poplatek sítě", "Schválit 1.5 USDC"]) {
      expect(text).toContain(label);
    }
    expect(text).toMatch(/Platí se v \w+ za každý krok, výši uvidíte v peněžence/);
    expect(czechPayButton().textContent).toBe("Zaplatit 1.5 USDC");
    expect(text).not.toMatch(NO_DASH);
  });

  it("uses the Czech extend copy for an existing config", () => {
    setReady();
    const text = czechText({ hasExistingConfig: true });

    expect(text).toContain("Prodlužte přístup a upravte svá upozornění");
    expect(text).toContain("Vaše dřívější nastavení upozornění zůstalo uložené.");
  });

  it.each([
    [86_400n, "1 den"],
    [259_200n, "3 dny"],
    [129_600n, "Přibližně 2 dny"],
  ])("states %s seconds of access as %j", (durationSeconds, period) => {
    fake.chain.plans = [PRICE, durationSeconds, true];
    setReady();
    renderCzech();

    expect(screen.getByText(period).tagName).toBe("DD");
  });

  it("explains a paused paywall in Czech", () => {
    fake.chain.paused = true;
    setReady();

    expect(czechText()).toContain("Platby jsou momentálně pozastavené. Zkuste to později.");
  });

  it("toasts the payment's outcome in Czech", async () => {
    setReady();
    renderCzech();
    fireEvent.click(czechPayButton());
    await waitFor(() => expect(screen.queryByRole("button", { busy: true })).toBeNull());

    expect(fake.toasts).toEqual([["success", "Přístup je aktivní. Teď si můžete nastavit upozornění."]]);
  });

  it("toasts a pause found at click time in Czech", async () => {
    setReady();
    renderCzech();
    fake.chain.paused = true;
    fireEvent.click(czechPayButton());
    await waitFor(() => expect(screen.queryByRole("button", { busy: true })).toBeNull());

    expect(fake.toasts).toEqual([["error", "Platby jsou momentálně pozastavené. Zkuste to později."]]);
  });
});
