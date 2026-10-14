import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminPage from "~~/app/admin/page";
import { renderStaticMarkup } from "~~/utils/testing/render";

// Fixture values: the constants module is mocked below, so nothing here depends on the deployment or scaffold config.
const PAYWALL = "0x79872d7529cfE1c062838fACDA004Ce4BFB16553";
const TOKEN = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
const OWNER = "0x2222222222222222222222222222222222222222";
const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
const DESTINATION = "0x4444444444444444444444444444444444444444";
const NEW_OWNER = "0x5555555555555555555555555555555555555555";

type TokenData = { decimals?: number; symbol?: string; balanceOf?: bigint };

const { state, calls, formState, resetState } = vi.hoisted(() => {
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
  const initialFormState = () => ({ enabled: false, slots: [] as unknown[], cursor: 0 });
  const formState = initialFormState();
  return {
    state,
    calls,
    formState,
    resetState: () => {
      Object.assign(state, initialState());
      Object.assign(formState, initialFormState());
      calls.length = 0;
    },
  };
});

// Fizz drops state updates made after render. Interaction tests switch useState to slots kept in `formState` and
// re-render, so typed values persist the way they would in the browser. Slots are keyed by call order.
vi.mock("react", async importOriginal => {
  const actual = await importOriginal<typeof import("react")>();
  const useState = (initial: unknown) => {
    if (!formState.enabled) return actual.useState(initial);
    const slot = formState.cursor++;
    if (!(slot in formState.slots)) {
      formState.slots[slot] = typeof initial === "function" ? (initial as () => unknown)() : initial;
    }
    const setState = (next: unknown) => {
      formState.slots[slot] =
        typeof next === "function" ? (next as (previous: unknown) => unknown)(formState.slots[slot]) : next;
    };
    return [formState.slots[slot], setState];
  };
  return { ...actual, useState };
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
    recordHook("useReadContract", { ...rest, abiIsErc20: abi === erc20AbiRef.current });
    const token: TokenData = state.tokens[String(config.address)] ?? {
      decimals: state.decimals,
      symbol: state.symbol,
      balanceOf: state.tokenBalance,
    };
    return { data: token[config.functionName as keyof TokenData], refetch: refetch(`erc20.${config.functionName}`) };
  },
}));

const erc20AbiRef = vi.hoisted(() => ({ current: undefined as unknown }));
vi.mock("viem", async importOriginal => {
  const actual = await importOriginal<typeof import("viem")>();
  erc20AbiRef.current = actual.erc20Abi;
  return actual;
});

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

vi.mock("@scaffold-ui/components", () => ({
  Address: ({ address }: { address: string }) => <span data-address={address} />,
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

type HostElement = ReactElement<{
  children?: ReactNode;
  onClick?: () => unknown;
  onChange?: (event: { target: { value?: string; checked?: boolean } }) => void;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
}>;

/** Host elements in document order. Hook-free child components are expanded by calling them. */
const hostElements = (node: ReactNode): HostElement[] => {
  if (Array.isArray(node)) return node.flatMap(hostElements);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as HostElement;
  if (typeof element.type === "function") {
    return hostElements((element.type as (props: unknown) => ReactNode)(element.props));
  }
  return [element, ...hostElements(element.props.children)];
};

const renderPage = () => {
  let tree: ReactNode;
  const Probe = () => {
    formState.cursor = 0;
    tree = (AdminPage as () => ReactNode)();
    return <>{tree}</>;
  };
  const html = renderStaticMarkup(<Probe />);
  return {
    html,
    elements: () => hostElements(tree),
    buttons: () => hostElements(tree).filter(element => element.type === "button"),
  };
};

/** The elements of the card whose heading is `title`. */
const cardElements = (elements: HostElement[], title: string) => {
  const body = elements.find(element =>
    [element.props.children]
      .flat()
      .some(
        child => (child as HostElement | undefined)?.type === "h2" && (child as HostElement).props.children === title,
      ),
  );
  expect(body, `card "${title}"`).toBeDefined();
  return hostElements(body?.props.children);
};

/** Renders the page with persistent state, re-rendering after every input change and click. */
const openInteractivePage = () => {
  formState.enabled = true;
  let page = renderPage();
  const rerender = () => {
    calls.length = 0;
    page = renderPage();
  };
  rerender();

  const findInput = (card: string, matches: (input: HostElement) => boolean, label: string) => {
    const input = cardElements(page.elements(), card).find(element => element.type === "input" && matches(element));
    expect(input, `${card}: ${label}`).toBeDefined();
    return input as HostElement;
  };

  return {
    html: () => page.html,
    /** Types into the input of `card` whose placeholder starts with `placeholder` (symbols are appended to some). */
    type: (card: string, placeholder: string, value: string) => {
      findInput(card, input => Boolean(input.props.placeholder?.startsWith(placeholder)), placeholder).props.onChange?.(
        {
          target: { value },
        },
      );
      rerender();
    },
    setChecked: (card: string, checked: boolean) => {
      findInput(card, input => input.props.type === "checkbox", "checkbox").props.onChange?.({ target: { checked } });
      rerender();
    },
    /** Clicks the button and returns the writes and refetches it made. */
    click: async (label: string) => {
      const button = page.buttons().find(candidate => candidate.props.children === label);
      expect(button, label).toBeDefined();
      calls.length = 0;
      await button?.props.onClick?.();
      const made = [...calls];
      rerender();
      return made;
    },
  };
};

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

beforeEach(() => {
  resetState();
});

describe("AdminPage markup", () => {
  it("renders the not-deployed alert when the paywall has no deployment", () => {
    state.deployed = false;
    expect(renderPage().html).toMatchSnapshot();
  });

  it("asks to connect a wallet and shows the loading owner", () => {
    expect(renderPage().html).toMatchSnapshot();
  });

  it("denies a connected wallet that is not the owner", () => {
    state.connectedAddress = "0x3333333333333333333333333333333333333333";
    state.owner = OWNER;
    expect(renderPage().html).toMatchSnapshot();
  });

  it("shows neither cards nor the denial while the owner is loading", () => {
    state.connectedAddress = OWNER;
    state.isOwnerLoading = true;
    expect(renderPage().html).toMatchSnapshot();
  });

  it("shows every card with loaded data for the owner (case-insensitive match)", () => {
    setOwnerConnected();
    setLoadedData();
    expect(renderPage().html).toMatchSnapshot();
  });

  it("falls back to placeholders while the owner's data loads", () => {
    setOwnerConnected();
    expect(renderPage().html).toMatchSnapshot();
  });

  it("disables every action while a transaction is pending and pause once paused", () => {
    setOwnerConnected();
    setLoadedData();
    state.paused = true;
    state.isPending = true;
    expect(renderPage().html).toMatchSnapshot();
  });

  it("disables every action while a transaction is mining", () => {
    setOwnerConnected();
    setLoadedData();
    state.isMining = true;
    const disabled = renderPage()
      .buttons()
      .map(button => button.props.disabled);
    expect(disabled).toEqual([true, true, true, true, true, true, true]);
  });

  it("formats an 18-decimals plan token", () => {
    setOwnerConnected();
    setLoadedData();
    state.decimals = 18;
    state.symbol = "DAI";
    state.plan = [10_000_000_000_000_000_000n, 86_400n, false];
    state.tokenBalance = 5n;
    expect(renderPage().html).toMatchSnapshot();
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

const REFETCH_ALL = [
  ["refetch", "owner"],
  ["refetch", "paused"],
  ["refetch", "maxDurationSeconds"],
  ["refetch", "plans"],
  ["refetch", "nativeBalance"],
  ["refetch", "erc20.balanceOf"],
];

describe("AdminPage actions", () => {
  const click = async (label: string) => {
    const { buttons } = renderPage();
    const button = buttons().find(candidate => candidate.props.children === label);
    expect(button).toBeDefined();
    calls.length = 0;
    await button?.props.onClick?.();
    return calls;
  };

  it.each([
    ["Pause", "pause"],
    ["Unpause", "unpause"],
  ])("%s writes %s and then refetches everything", async (label, functionName) => {
    setOwnerConnected();
    setLoadedData();
    expect(await click(label)).toEqual([["writeContractAsync", { functionName }], ...REFETCH_ALL]);
  });

  it("skips the refetch when the transaction fails", async () => {
    setOwnerConnected();
    setLoadedData();
    state.writeImpl = () => Promise.reject(new Error("reverted"));
    expect(await click("Pause")).toEqual([["writeContractAsync", { functionName: "pause" }]]);
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
    const page = openInteractivePage();
    expect(await page.click(label)).toEqual([]);
    expect(page.html()).toContain(`<div class="alert alert-error"><span>${message}</span></div>`);
  });

  it("replaces a validation error with the transaction error, and clears it on success", async () => {
    const page = openInteractivePage();
    await page.click("Save plan");
    state.writeImpl = () => Promise.reject(new Error("reverted"));
    await page.click("Pause");
    expect(page.html()).toContain('<div class="alert alert-error"><span>reverted</span></div>');
    expect(page.html()).not.toContain("Enter plan price and duration");
    state.writeImpl = () => Promise.resolve("0xhash");
    await page.click("Pause");
    expect(page.html()).not.toContain("reverted");
  });

  it("shows each card the metadata of its own token", () => {
    const page = openInteractivePage();
    page.type("Withdraw token", "Token address", DAI);
    expect(page.html()).toMatchSnapshot();
  });

  it("reads the metadata and balance of each form's own token", () => {
    const page = openInteractivePage();
    page.type("Withdraw token", "Token address", DAI);
    expect(hookConfigs()).toMatchSnapshot();
  });

  it("scales the plan price with the plan token's decimals, not the withdraw token's", async () => {
    const page = openInteractivePage();
    page.type("Withdraw token", "Token address", DAI);
    page.type("Update plan", "Price (", "1.5");
    page.type("Update plan", "Duration seconds", "2592000");
    page.setChecked("Update plan", false);
    expect(await page.click("Save plan")).toEqual([
      ["writeContractAsync", { functionName: "setPlan", args: [TOKEN, 1_500_000n, 2_592_000n, false] }],
      ...REFETCH_ALL,
    ]);
  });

  it("scales the plan price with a newly entered plan token's decimals", async () => {
    const page = openInteractivePage();
    page.type("Update plan", "Token address", DAI);
    page.type("Update plan", "Price (", "1.5");
    page.type("Update plan", "Duration seconds", "86400");
    expect(await page.click("Save plan")).toEqual([
      ["writeContractAsync", { functionName: "setPlan", args: [DAI, 1_500_000_000_000_000_000n, 86_400n, true] }],
      ...REFETCH_ALL,
    ]);
  });

  it("scales the token withdrawal with the withdraw token's decimals, not the plan token's", async () => {
    const page = openInteractivePage();
    page.type("Withdraw token", "Token address", DAI);
    page.type("Withdraw token", "Destination address", DESTINATION);
    page.type("Withdraw token", "Amount (", "2");
    expect(await page.click("Withdraw token")).toEqual([
      ["writeContractAsync", { functionName: "withdrawTokens", args: [DAI, DESTINATION, 2_000_000_000_000_000_000n] }],
      ...REFETCH_ALL,
    ]);
  });

  it("withdraws the typed native amount to the typed address", async () => {
    const page = openInteractivePage();
    page.type("Withdraw native", "Destination address", DESTINATION);
    page.type("Withdraw native", "Amount in ETH", "1.25");
    expect(await page.click("Withdraw native")).toEqual([
      ["writeContractAsync", { functionName: "withdrawNative", args: [DESTINATION, 1_250_000_000_000_000_000n] }],
      ...REFETCH_ALL,
    ]);
  });

  it("sets the typed max duration", async () => {
    const page = openInteractivePage();
    page.type("Max duration", "New max duration (seconds)", "86400");
    expect(await page.click("Update max duration")).toEqual([
      ["writeContractAsync", { functionName: "setMaxDurationSeconds", args: [86_400n] }],
      ...REFETCH_ALL,
    ]);
  });

  it("transfers ownership to the typed address", async () => {
    const page = openInteractivePage();
    page.type("Transfer ownership", "New owner address", NEW_OWNER);
    expect(await page.click("Transfer ownership")).toEqual([
      ["writeContractAsync", { functionName: "transferOwnership", args: [NEW_OWNER] }],
      ...REFETCH_ALL,
    ]);
  });
});
