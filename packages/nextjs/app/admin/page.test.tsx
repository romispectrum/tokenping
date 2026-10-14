// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { BaseError, erc20Abi } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminPage from "~~/app/admin/page";

// Fixture values: the constants module is mocked below, so nothing here depends on the deployment or scaffold config.
const { PAYWALL, TOKEN } = vi.hoisted(() => ({
  PAYWALL: "0x79872d7529cfE1c062838fACDA004Ce4BFB16553",
  TOKEN: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
}));
const OWNER = "0x2222222222222222222222222222222222222222";
const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
const DESTINATION = "0x4444444444444444444444444444444444444444";
const NEW_OWNER = "0x5555555555555555555555555555555555555555";

type TokenData = {
  decimals?: number;
  symbol?: string;
  balanceOf?: bigint;
  /** ERC-20 reads of this token that are still loading. */
  loading?: string[];
};

const { state, calls, resetState } = vi.hoisted(() => {
  const initialState = () => ({
    deployed: true,
    connectedAddress: undefined as string | undefined,
    owner: undefined as string | undefined,
    isOwnerLoading: false,
    paused: undefined as boolean | undefined,
    maxDuration: undefined as bigint | undefined,
    plan: undefined as readonly [bigint, bigint, boolean] | undefined,
    decimals: undefined as number | undefined,
    symbol: undefined as string | undefined,
    nativeBalance: undefined as { value: bigint } | undefined,
    tokenBalance: undefined as bigint | undefined,
    isPending: false,
    isMining: false,
    writeImpl: (() => Promise.resolve("0xhash")) as (...args: unknown[]) => Promise<unknown>,
    /** ERC-20 reads by token address; addresses not listed fall back to decimals/symbol/tokenBalance above. */
    tokens: {} as Record<string, TokenData>,
  });
  const state = initialState();
  const calls: unknown[][] = [];
  return {
    state,
    calls,
    resetState: () => {
      Object.assign(state, initialState());
      calls.length = 0;
    },
  };
});

const refetch = (name: string) => () => {
  calls.push(["refetch", name]);
  return Promise.resolve({});
};

/** Hook configs without their functions, so they can be compared as data. */
const recordHook = (hook: string, config: Record<string, unknown>) => calls.push(["hook", hook, config]);

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: state.connectedAddress, isConnected: state.connectedAddress !== undefined }),
  useBalance: (config: Record<string, unknown>) => {
    recordHook("useBalance", config);
    return { data: state.nativeBalance, refetch: refetch("nativeBalance") };
  },
  useReadContract: (config: Record<string, unknown>) => {
    const { abi, ...rest } = config;
    recordHook("useReadContract", { ...rest, abiIsErc20: abi === erc20Abi });
    const functionName = config.functionName as "decimals" | "symbol" | "balanceOf";
    const token: TokenData = state.tokens[String(config.address)] ?? {
      decimals: state.decimals,
      symbol: state.symbol,
      balanceOf: state.tokenBalance,
    };
    const isLoading = Boolean(token.loading?.includes(functionName));
    return {
      data: isLoading ? undefined : token[functionName],
      isLoading,
      refetch: refetch(`erc20.${functionName}`),
    };
  },
}));

vi.mock("~~/hooks/scaffold-eth", () => ({
  useScaffoldReadContract: (config: Record<string, unknown>) => {
    recordHook("useScaffoldReadContract", config);
    const byFunction: Record<string, unknown> = {
      owner: state.owner,
      paused: state.paused,
      maxDurationSeconds: state.maxDuration,
      plans: state.plan,
    };
    return {
      data: byFunction[config.functionName as string],
      isLoading: config.functionName === "owner" ? state.isOwnerLoading : false,
      refetch: refetch(config.functionName as string),
    };
  },
  useScaffoldWriteContract: (config: Record<string, unknown>) => {
    recordHook("useScaffoldWriteContract", config);
    return {
      writeContractAsync: (variables: unknown) => {
        calls.push(["writeContractAsync", variables]);
        return state.writeImpl(variables);
      },
      isPending: state.isPending,
      isMining: state.isMining,
    };
  },
}));

// Stand-ins with the scaffold-ui props: the real Address resolves ENS names and EtherInput fetches the ETH price.
vi.mock("@scaffold-ui/components", () => ({
  Address: ({ address }: { address: string }) => <span data-address={address} />,
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
      data-component="EtherInput"
      placeholder={placeholder}
      defaultValue={defaultValue}
      onChange={event => onValueChange?.({ valueInEth: event.target.value, valueInUsd: "", displayUsdMode: false })}
    />
  ),
}));

vi.mock("~~/constants/payments", () => ({
  get PAYMENT_CHAIN_ID() {
    return state.deployed ? 42161 : undefined;
  },
  get PAYMENT_CONTRACT_ADDRESS() {
    return state.deployed ? PAYWALL : undefined;
  },
  get PAYMENT_TOKEN_ADDRESS() {
    return state.deployed ? TOKEN : undefined;
  },
}));

const renderPage = () => render(<AdminPage />);

const html = () => renderPage().container.innerHTML;

/** The body of the card whose heading is `title`. */
const card = (title: string) => {
  const body = screen.getByRole("heading", { name: title }).parentElement;
  expect(body, `card "${title}"`).not.toBeNull();
  return within(body as HTMLElement);
};

const type = (cardTitle: string, label: string | RegExp, value: string) =>
  fireEvent.change(card(cardTitle).getByLabelText(label), { target: { value } });

/** Clicks the button, lets the awaited write and refetches settle, and returns the writes and refetches it made. */
const click = async (label: string) => {
  const button = screen.getByRole("button", { name: label });
  calls.length = 0;
  await act(async () => {
    fireEvent.click(button);
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  return calls.filter(([kind]) => kind !== "hook");
};

/** The texts of the error alerts (the page's alerts carry no role). */
const alertText = () => [...document.querySelectorAll(".alert-error")].map(alert => alert.textContent);

/** Key order is irrelevant to wagmi/react-query (query keys are hashed with sorted keys), so serialize sorted. */
const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, sortKeys(nested)]),
    );
  }
  return value === undefined ? null : value;
};

const hookConfigs = () =>
  calls
    .filter(([kind]) => kind === "hook")
    .map(([, hook, config]) => JSON.stringify([hook, sortKeys(config)]))
    .sort();

const setOwnerConnected = () => {
  state.connectedAddress = OWNER;
  state.owner = OWNER.toUpperCase().replace("0X", "0x");
};

const setLoadedData = () => {
  state.paused = false;
  state.maxDuration = 31_536_000n;
  state.plan = [1_500_000n, 2_592_000n, true];
  state.decimals = 6;
  state.symbol = "USDC";
  state.nativeBalance = { value: 1_250_000_000_000_000_000n };
  state.tokenBalance = 12_345_678n;
};

const REFETCH_ALL = [
  ["refetch", "owner"],
  ["refetch", "paused"],
  ["refetch", "maxDurationSeconds"],
  ["refetch", "plans"],
  ["refetch", "nativeBalance"],
  ["refetch", "erc20.balanceOf"],
];

beforeEach(() => {
  resetState();
});

describe("AdminPage markup", () => {
  it("renders the not-deployed alert when the paywall has no deployment", () => {
    state.deployed = false;
    expect(html()).toMatchSnapshot();
  });

  it("asks to connect a wallet and shows the loading owner", () => {
    expect(html()).toMatchSnapshot();
  });

  it("denies a connected wallet that is not the owner", () => {
    state.connectedAddress = "0x3333333333333333333333333333333333333333";
    state.owner = OWNER;
    expect(html()).toMatchSnapshot();
  });

  it("shows neither cards nor the denial while the owner is loading", () => {
    state.connectedAddress = OWNER;
    state.isOwnerLoading = true;
    expect(html()).toMatchSnapshot();
  });

  it("shows every card with loaded data for the owner (case-insensitive match)", () => {
    setOwnerConnected();
    setLoadedData();
    expect(html()).toMatchSnapshot();
  });

  it("falls back to placeholders while the owner's data loads", () => {
    setOwnerConnected();
    expect(html()).toMatchSnapshot();
  });

  it("disables every action while a transaction is pending and pause once paused", () => {
    setOwnerConnected();
    setLoadedData();
    state.paused = true;
    state.isPending = true;
    expect(html()).toMatchSnapshot();
  });

  it("disables every action while a transaction is mining", () => {
    setOwnerConnected();
    setLoadedData();
    state.isMining = true;
    renderPage();
    const disabled = screen.getAllByRole("button").map(button => button.hasAttribute("disabled"));
    expect(disabled).toEqual([true, true, true, true, true, true, true]);
  });

  it("formats an 18-decimals plan token", () => {
    setOwnerConnected();
    setLoadedData();
    state.decimals = 18;
    state.symbol = "DAI";
    state.plan = [10_000_000_000_000_000_000n, 86_400n, false];
    state.tokenBalance = 5n;
    expect(html()).toMatchSnapshot();
  });
});

describe("AdminPage inputs", () => {
  beforeEach(() => {
    setOwnerConnected();
    setLoadedData();
  });

  // Regression (F9): the address fields were scaffold-ui AddressInputs, which resolve ENS names on Ethereum mainnet,
  // while these transactions run on Arbitrum.
  it.each([
    ["Max duration", "New max duration (seconds)", "INPUT"],
    ["Update plan", "Token address", "INPUT"],
    ["Update plan", "Price (USDC)", "INPUT"],
    ["Update plan", "Duration (seconds)", "INPUT"],
    ["Update plan", "Plan enabled", "INPUT"],
    ["Withdraw native", "Destination address", "INPUT"],
    ["Withdraw native", "Amount (ETH)", "EtherInput"],
    ["Withdraw token", "Token address", "INPUT"],
    ["Withdraw token", "Destination address", "INPUT"],
    ["Withdraw token", "Amount (USDC)", "INPUT"],
    ["Transfer ownership", "New owner address", "INPUT"],
  ])("%s has a visible %j label on its control (%s)", (cardTitle, label, component) => {
    renderPage();
    const control = card(cardTitle).getByLabelText(label);
    expect(control.getAttribute("data-component") ?? control.tagName).toBe(component);
  });
});

describe("AdminPage address fields", () => {
  const ADDRESS_FIELDS = [
    ["Update plan", "Token address"],
    ["Withdraw native", "Destination address"],
    ["Withdraw token", "Token address"],
    ["Withdraw token", "Destination address"],
    ["Transfer ownership", "New owner address"],
  ] as const;

  beforeEach(() => {
    setOwnerConnected();
    setLoadedData();
  });

  it.each(ADDRESS_FIELDS)("%s: %j is a plain DaisyUI text input", (cardTitle, label) => {
    renderPage();
    const control = card(cardTitle).getByLabelText(label);
    expect(control.getAttribute("type")).toBe("text");
    expect(control.className.split(" ")).toEqual(expect.arrayContaining(["input", "input-bordered"]));
  });

  it.each(ADDRESS_FIELDS)("%s: %j marks an ENS name as invalid and keeps it as typed", (cardTitle, label) => {
    renderPage();
    type(cardTitle, label, "vitalik.eth");
    const control = card(cardTitle).getByLabelText(label) as HTMLInputElement;
    expect(control.value).toBe("vitalik.eth");
    expect(control.getAttribute("aria-invalid")).toBe("true");
  });

  it.each(ADDRESS_FIELDS)("%s: %j accepts a lowercase or checksummed 0x address", (cardTitle, label) => {
    renderPage();
    for (const address of [NEW_OWNER, PAYWALL]) {
      type(cardTitle, label, address);
      expect(card(cardTitle).getByLabelText(label).getAttribute("aria-invalid")).toBeNull();
    }
  });

  it("refuses an ENS name for the new owner instead of resolving it", async () => {
    renderPage();
    type("Transfer ownership", "New owner address", "vitalik.eth");
    expect(await click("Transfer ownership")).toEqual([]);
    expect(alertText()).toEqual(["Enter a valid new owner address"]);
  });

  it("refuses a mixed-case address with a wrong checksum as a withdraw destination", async () => {
    renderPage();
    type("Withdraw native", "Destination address", "0x79872D7529cfE1c062838fACDA004Ce4BFB16553");
    expect(card("Withdraw native").getByLabelText("Destination address").getAttribute("aria-invalid")).toBe("true");
    type("Withdraw native", "Amount (ETH)", "1");
    expect(await click("Withdraw native")).toEqual([]);
    expect(alertText()).toEqual(["Enter a valid destination address for native withdraw"]);
  });

  it("trims the spaces around a pasted address", async () => {
    renderPage();
    type("Transfer ownership", "New owner address", `  ${NEW_OWNER}\n`);
    expect(await click("Transfer ownership")).toEqual([
      ["writeContractAsync", { functionName: "transferOwnership", args: [NEW_OWNER] }],
      ...REFETCH_ALL,
    ]);
  });
});

describe("AdminPage reads", () => {
  it("issues the same reads for the owner view", () => {
    setOwnerConnected();
    renderPage();
    expect(hookConfigs()).toMatchSnapshot();
  });

  it("issues the same reads when the paywall is not deployed", () => {
    state.deployed = false;
    renderPage();
    expect(hookConfigs()).toMatchSnapshot();
  });
});

describe("AdminPage actions", () => {
  beforeEach(() => {
    setOwnerConnected();
    setLoadedData();
  });

  it.each([
    ["Pause", "pause"],
    ["Unpause", "unpause"],
  ])("%s writes %s and then refetches everything", async (label, functionName) => {
    if (label === "Unpause") state.paused = true;
    renderPage();
    expect(await click(label)).toEqual([["writeContractAsync", { functionName }], ...REFETCH_ALL]);
    expect(alertText()).toEqual([]);
  });

  it("skips the refetch and shows the error when the transaction fails", async () => {
    state.writeImpl = () => Promise.reject(new Error("reverted"));
    renderPage();
    expect(await click("Pause")).toEqual([["writeContractAsync", { functionName: "pause" }]]);
    expect(alertText()).toEqual(["reverted"]);
  });

  // Regression (I4): the alert used to show viem's full multi-line message (details, docs link, version).
  it("shows the parsed viem error, not the raw multi-line message", async () => {
    const error = new BaseError("User rejected the request.");
    expect(error.message).toContain("\n");
    state.writeImpl = () => Promise.reject(error);
    renderPage();
    await click("Pause");
    expect(alertText()).toEqual(["User rejected the request."]);
  });

  // Regression (B2.2): SE-2 resolves undefined (after its own toast) when nothing was sent; that is not a success.
  it("neither refetches nor reports anything when the write resolves undefined", async () => {
    state.writeImpl = () => Promise.resolve(undefined);
    renderPage();
    expect(await click("Pause")).toEqual([["writeContractAsync", { functionName: "pause" }]]);
    expect(alertText()).toEqual([]);
  });
});

describe("AdminPage forms", () => {
  beforeEach(() => {
    setOwnerConnected();
    setLoadedData();
    // Two tokens with different decimals, so it shows which token's metadata each card and handler uses.
    state.tokens = {
      [TOKEN]: { decimals: 6, symbol: "USDC", balanceOf: 12_345_678n },
      [DAI]: { decimals: 18, symbol: "DAI", balanceOf: 5_000_000_000_000_000_000n },
    };
  });

  it.each([
    ["Update max duration", "Enter max duration in seconds"],
    ["Save plan", "Enter plan price and duration"],
    ["Withdraw native", "Enter a valid destination address for native withdraw"],
    ["Withdraw token", "Enter a valid destination address for token withdraw"],
    ["Transfer ownership", "Enter a valid new owner address"],
  ])("%s shows %j and does not write with the initial form", async (label, message) => {
    renderPage();
    expect(await click(label)).toEqual([]);
    expect(alertText()).toEqual([message]);
  });

  it("replaces a validation error with the transaction error, and clears it on success", async () => {
    renderPage();
    await click("Save plan");
    state.writeImpl = () => Promise.reject(new Error("reverted"));
    await click("Pause");
    expect(alertText()).toEqual(["reverted"]);
    state.writeImpl = () => Promise.resolve("0xhash");
    await click("Pause");
    expect(alertText()).toEqual([]);
  });

  it("shows each card the metadata of its own token", () => {
    const { container } = renderPage();
    type("Withdraw token", "Token address", DAI);
    expect(container.innerHTML).toMatchSnapshot();
  });

  it("reads the metadata and balance of each form's own token", () => {
    renderPage();
    calls.length = 0;
    type("Withdraw token", "Token address", DAI);
    expect(hookConfigs()).toMatchSnapshot();
  });

  it("scales the plan price with the plan token's decimals, not the withdraw token's", async () => {
    renderPage();
    type("Withdraw token", "Token address", DAI);
    type("Update plan", /^Price \(/, "1.5");
    type("Update plan", "Duration (seconds)", "2592000");
    fireEvent.click(card("Update plan").getByLabelText("Plan enabled"));
    expect(await click("Save plan")).toEqual([
      ["writeContractAsync", { functionName: "setPlan", args: [TOKEN, 1_500_000n, 2_592_000n, false] }],
      ...REFETCH_ALL,
    ]);
  });

  it("scales the plan price with a newly entered plan token's decimals", async () => {
    renderPage();
    type("Update plan", "Token address", DAI);
    type("Update plan", /^Price \(/, "1.5");
    type("Update plan", "Duration (seconds)", "86400");
    expect(await click("Save plan")).toEqual([
      ["writeContractAsync", { functionName: "setPlan", args: [DAI, 1_500_000_000_000_000_000n, 86_400n, true] }],
      ...REFETCH_ALL,
    ]);
  });

  it("scales the token withdrawal with the withdraw token's decimals, not the plan token's", async () => {
    renderPage();
    type("Withdraw token", "Token address", DAI);
    type("Withdraw token", "Destination address", DESTINATION);
    type("Withdraw token", /^Amount \(/, "2");
    expect(await click("Withdraw token")).toEqual([
      ["writeContractAsync", { functionName: "withdrawTokens", args: [DAI, DESTINATION, 2_000_000_000_000_000_000n] }],
      ...REFETCH_ALL,
    ]);
  });

  it("withdraws the typed native amount to the typed address", async () => {
    renderPage();
    type("Withdraw native", "Destination address", DESTINATION);
    type("Withdraw native", "Amount (ETH)", "1.25");
    expect(await click("Withdraw native")).toEqual([
      ["writeContractAsync", { functionName: "withdrawNative", args: [DESTINATION, 1_250_000_000_000_000_000n] }],
      ...REFETCH_ALL,
    ]);
  });

  it("sets the typed max duration", async () => {
    renderPage();
    type("Max duration", "New max duration (seconds)", "86400");
    expect(await click("Update max duration")).toEqual([
      ["writeContractAsync", { functionName: "setMaxDurationSeconds", args: [86_400n] }],
      ...REFETCH_ALL,
    ]);
  });

  it("transfers ownership to the typed address", async () => {
    renderPage();
    type("Transfer ownership", "New owner address", NEW_OWNER);
    expect(await click("Transfer ownership")).toEqual([
      ["writeContractAsync", { functionName: "transferOwnership", args: [NEW_OWNER] }],
      ...REFETCH_ALL,
    ]);
  });
});

// Regression (B2.4): while decimals were loading or unreadable, amounts were silently scaled with 6 decimals.
describe("AdminPage token decimals", () => {
  beforeEach(() => {
    setOwnerConnected();
    setLoadedData();
    state.tokens = { [TOKEN]: { decimals: 6, symbol: "USDC", balanceOf: 12_345_678n } };
  });

  const isDisabled = (label: string) => screen.getByRole("button", { name: label }).hasAttribute("disabled");

  it.each([
    ["Update plan", "Save plan"],
    ["Withdraw token", "Withdraw token"],
  ])("%s: %s is enabled with known decimals and says which", (cardTitle, button) => {
    renderPage();
    expect(isDisabled(button)).toBe(false);
    expect(card(cardTitle).getByText("Detected decimals: 6")).toBeDefined();
  });

  it.each([
    ["Update plan", "Save plan"],
    ["Withdraw token", "Withdraw token"],
  ])("%s: %s waits while the decimals load", (cardTitle, button) => {
    state.tokens[DAI] = { symbol: "DAI", balanceOf: 0n, loading: ["decimals"] };
    renderPage();
    type(cardTitle, "Token address", DAI);
    expect(isDisabled(button)).toBe(true);
    expect(card(cardTitle).getByText("Loading token decimals...")).toBeDefined();
  });

  it.each([
    ["Update plan", "Save plan", "Saving"],
    ["Withdraw token", "Withdraw token", "Withdrawing"],
  ])("%s: %s stays disabled when the decimals cannot be read", (cardTitle, button, action) => {
    state.tokens[DAI] = { symbol: undefined, balanceOf: undefined };
    renderPage();
    type(cardTitle, "Token address", DAI);
    expect(isDisabled(button)).toBe(true);
    expect(
      card(cardTitle).getByText(
        `Token decimals unknown: check the token address. ${action} is disabled until they load.`,
      ),
    ).toBeDefined();
  });
});
