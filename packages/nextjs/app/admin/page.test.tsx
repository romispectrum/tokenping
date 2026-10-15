// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { BaseError, UserRejectedRequestError, erc20Abi } from "viem";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
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

const renderPage = () => render(<AdminPage />);

const html = () => renderPage().container.innerHTML;

/** The card (a region named by its heading) whose title is `title`. */
const card = (title: string) => within(screen.getByRole("region", { name: title }));

const type = (cardTitle: string, label: string | RegExp, value: string) =>
  fireEvent.change(card(cardTitle).getByLabelText(label), { target: { value } });

/** Runs a user action, lets the awaited write and refetches settle, and returns the writes and refetches it made. */
const settle = async (action: () => void) => {
  calls.length = 0;
  await act(async () => {
    action();
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  return calls.filter(([kind]) => kind !== "hook");
};

/** Clicks the button outside any dialog. */
const click = (label: string) => {
  const button = screen.getAllByRole("button", { name: label }).find(element => !element.closest("dialog"));
  if (!button) throw new Error(`No button named ${label}`);
  return settle(() => fireEvent.click(button));
};

/** The admin actions: every button except the address chips' copy buttons, which stay usable. */
const actionButtons = () =>
  screen.getAllByRole("button").filter(button => !button.getAttribute("aria-label")?.startsWith("Copy "));

/** The open confirm dialog. */
const dialog = () => within(screen.getByRole("alertdialog"));

/** Clicks the transfer card's button, then the confirm dialog's own "Transfer ownership". */
const confirmTransfer = async () => {
  await click("Transfer ownership");
  return settle(() => fireEvent.click(dialog().getByRole("button", { name: "Transfer ownership" })));
};

/** The message a field shows (its aria-describedby error), or null. */
const fieldError = (cardTitle: string, label: string | RegExp) => {
  const control = card(cardTitle).getByLabelText(label);
  const error = (control.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .map(id => document.getElementById(id))
    .find(element => element?.getAttribute("role") === "alert");
  return error?.textContent ?? null;
};

/** The text blocks of an element, joined: an alert with a title reads "Title: message". */
const textBlocks = (element: Element) =>
  [...element.querySelectorAll("*")]
    .filter(node => node.children.length === 0 && node.textContent)
    .map(node => node.textContent)
    .join(": ");

/** The alerts of a variant on the page (an alert is a note; its live region announces it). */
const alertText = (variant = "destructive") =>
  [...document.querySelectorAll(`[role="note"][data-variant="${variant}"]`)].map(textBlocks);

/** The destructive alerts inside one card. */
const cardAlertText = (title: string) =>
  [...screen.getByRole("region", { name: title }).querySelectorAll('[role="note"][data-variant="destructive"]')].map(
    textBlocks,
  );

const FAILED =
  "Transaction failed: The contract rejected this transaction, so nothing changed. The network fee was still spent if it reached the network.";

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
  // The page logs every raw transaction error (and never renders it); keep the test output readable.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("AdminPage markup", () => {
  it("renders the not-deployed alert when the paywall has no deployment", () => {
    state.deployed = false;
    expect(html()).toMatchSnapshot();
  });

  it("asks to connect a wallet while the owner is unknown", () => {
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
    expect(actionButtons().map(button => [button.textContent, button.hasAttribute("disabled")])).toEqual([
      ["Pause payments", true],
      ["Update max duration", true],
      ["Save plan", true],
      ["Withdraw ETH", true],
      ["Withdraw token", true],
      ["Transfer ownership", true],
    ]);
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
    ["Withdraw ETH", "Destination address", "INPUT"],
    ["Withdraw ETH", "Amount (ETH)", "INPUT"],
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
    ["Withdraw ETH", "Destination address"],
    ["Withdraw token", "Token address"],
    ["Withdraw token", "Destination address"],
    ["Transfer ownership", "New owner address"],
  ] as const;

  beforeEach(() => {
    setOwnerConnected();
    setLoadedData();
  });

  it.each(ADDRESS_FIELDS)("%s: %j is a plain text Input in the data font", (cardTitle, label) => {
    renderPage();
    const control = card(cardTitle).getByLabelText(label);
    expect(control.getAttribute("type")).toBe("text");
    expect(control.getAttribute("data-slot")).toBe("input");
    expect(control.className.split(" ")).toEqual(expect.arrayContaining(["input", "font-data"]));
  });

  it.each(ADDRESS_FIELDS)(
    "%s: %j keeps an ENS name as typed and flags it when the owner leaves",
    (cardTitle, label) => {
      renderPage();
      type(cardTitle, label, "vitalik.eth");
      const control = card(cardTitle).getByLabelText(label) as HTMLInputElement;
      expect(control.value).toBe("vitalik.eth");
      expect(control.getAttribute("aria-invalid")).toBeNull();
      fireEvent.blur(control);
      expect(control.getAttribute("aria-invalid")).toBe("true");
    },
  );

  it.each(ADDRESS_FIELDS)("%s: %j accepts a lowercase or checksummed 0x address", (cardTitle, label) => {
    renderPage();
    for (const address of [NEW_OWNER, PAYWALL]) {
      type(cardTitle, label, address);
      fireEvent.blur(card(cardTitle).getByLabelText(label));
      expect(card(cardTitle).getByLabelText(label).getAttribute("aria-invalid")).toBeNull();
    }
  });

  it("refuses an ENS name for the new owner instead of resolving it", async () => {
    renderPage();
    type("Transfer ownership", "New owner address", "vitalik.eth");
    expect(await click("Transfer ownership")).toEqual([]);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(fieldError("Transfer ownership", "New owner address")).toBe("Enter the new owner as a full 0x address.");
  });

  it("refuses a mixed-case address with a wrong checksum as a withdraw destination", async () => {
    renderPage();
    type("Withdraw ETH", "Destination address", "0x79872D7529cfE1c062838fACDA004Ce4BFB16553");
    type("Withdraw ETH", "Amount (ETH)", "1");
    expect(await click("Withdraw ETH")).toEqual([]);
    expect(fieldError("Withdraw ETH", "Destination address")).toBe("Enter the destination as a full 0x address.");
    expect(document.activeElement).toBe(card("Withdraw ETH").getByLabelText("Destination address"));
  });

  it("trims the spaces around a pasted address", async () => {
    renderPage();
    type("Transfer ownership", "New owner address", `  ${NEW_OWNER}\n`);
    expect(await confirmTransfer()).toEqual([
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
    ["Pause payments", "pause"],
    ["Unpause payments", "unpause"],
  ])("%s writes %s and then refetches everything", async (label, functionName) => {
    if (functionName === "unpause") state.paused = true;
    renderPage();
    expect(await click(label)).toEqual([["writeContractAsync", { functionName }], ...REFETCH_ALL]);
    expect(alertText()).toEqual([]);
  });

  it("skips the refetch, logs the raw error and shows a plain failure when the transaction fails", async () => {
    const error = new Error("execution reverted: 0xdeadbeef");
    state.writeImpl = () => Promise.reject(error);
    renderPage();
    expect(await click("Pause payments")).toEqual([["writeContractAsync", { functionName: "pause" }]]);
    expect(alertText()).toEqual([FAILED]);
    expect(console.error).toHaveBeenCalledWith(error);
  });

  // Regression (I4): the alert used to show viem's full multi-line message (details, docs link, version).
  it("never renders the raw viem message", async () => {
    const error = new BaseError("Something odd happened.");
    expect(error.message).toContain("\n");
    state.writeImpl = () => Promise.reject(error);
    renderPage();
    await click("Pause payments");
    expect(alertText()).toEqual([
      "Something went wrong: The transaction did not complete. Check the current values above before you try again.",
    ]);
  });

  it("shows a cancel in the wallet as a neutral note, not a failure", async () => {
    state.writeImpl = () => Promise.reject(new UserRejectedRequestError(new Error("User rejected the request.")));
    renderPage();
    await click("Pause payments");
    expect(alertText()).toEqual([]);
    expect(alertText("default")).toEqual([
      "Request cancelled: You cancelled the request in your wallet. Nothing was sent.",
    ]);
  });

  it("words a known contract revert reason", async () => {
    state.writeImpl = () =>
      Promise.reject({ name: "ContractFunctionRevertedError", reason: "Insufficient balance", message: "reverted" });
    renderPage();
    type("Withdraw ETH", "Destination address", DESTINATION);
    type("Withdraw ETH", "Amount (ETH)", "100");
    await click("Withdraw ETH");
    expect(cardAlertText("Withdraw ETH")).toEqual([
      "Transaction failed: The contract does not hold that much. Enter an amount up to the contract balance.",
    ]);
  });

  // Regression (B2.2): SE-2 resolves undefined (after its own toast) when nothing was sent; that is not a success.
  it("neither refetches nor reports anything when the write resolves undefined", async () => {
    state.writeImpl = () => Promise.resolve(undefined);
    renderPage();
    expect(await click("Pause payments")).toEqual([["writeContractAsync", { functionName: "pause" }]]);
    expect(alertText()).toEqual([]);
  });
});

describe("AdminPage action feedback", () => {
  beforeEach(() => {
    setOwnerConnected();
    setLoadedData();
  });

  it("shows each error in the card whose action failed, and moves it with the next action", async () => {
    renderPage();
    await click("Save plan");
    expect(fieldError("Update plan", /^Price \(/)).toBe("Enter a price, like 1.5.");
    expect(cardAlertText("Payments")).toEqual([]);
    state.writeImpl = () => Promise.reject(new Error("reverted"));
    await click("Pause payments");
    expect(cardAlertText("Payments")).toEqual([FAILED]);
    expect(fieldError("Update plan", /^Price \(/)).toBeNull();
    expect(cardAlertText("Update plan")).toEqual([]);
  });

  it.each([
    ["the wallet prompt", { isPending: true, isMining: true }, "Waiting for your wallet", true],
    ["the processing", { isPending: false, isMining: true }, "Pausing", false],
  ])("shows %s of the sent action and disables every other action", async (_label, flags, loading, prompt) => {
    state.writeImpl = () => new Promise(() => {});
    const { rerender } = renderPage();
    await click("Pause payments");
    Object.assign(state, flags);
    rerender(<AdminPage />);
    const pending = screen.getByRole("button", { name: loading });
    expect(pending.getAttribute("aria-busy")).toBe("true");
    expect(pending.hasAttribute("disabled")).toBe(false);
    const others = actionButtons().filter(button => button !== pending);
    expect(others.map(button => button.hasAttribute("disabled"))).toEqual([true, true, true, true, true]);
    expect(card("Payments").queryByText("Confirm the transaction in your wallet.") !== null).toBe(prompt);
  });

  it("sends nothing from a form submitted while another transaction is in flight", async () => {
    state.isMining = true;
    renderPage();
    type("Max duration", "New max duration (seconds)", "86400");
    const form = card("Max duration").getByLabelText("New max duration (seconds)").closest("form") as HTMLFormElement;
    expect(await settle(() => fireEvent.submit(form))).toEqual([]);
    expect(fieldError("Max duration", "New max duration (seconds)")).toBeNull();
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
    [
      "Update max duration",
      "Max duration",
      "New max duration (seconds)",
      "Enter a max duration in seconds, like 31536000.",
    ],
    ["Save plan", "Update plan", "Price (USDC)", "Enter a price, like 1.5."],
    ["Withdraw ETH", "Withdraw ETH", "Destination address", "Enter the destination as a full 0x address."],
    ["Withdraw token", "Withdraw token", "Destination address", "Enter the destination as a full 0x address."],
    ["Transfer ownership", "Transfer ownership", "New owner address", "Enter the new owner as a full 0x address."],
  ])(
    "%s with the initial form writes nothing, shows the message at %s %j and focuses it",
    async (button, cardTitle, label, message) => {
      renderPage();
      expect(await click(button)).toEqual([]);
      expect(fieldError(cardTitle, label)).toBe(message);
      const control = card(cardTitle).getByLabelText(label);
      expect(control.getAttribute("aria-invalid")).toBe("true");
      expect(document.activeElement).toBe(control);
      expect(alertText()).toEqual([]);
    },
  );

  it("re-checks the failed field on change, and leaves the untouched fields alone until the next submit", async () => {
    renderPage();
    await click("Save plan");
    type("Update plan", /^Price \(/, "abc");
    expect(fieldError("Update plan", /^Price \(/)).toBe("Enter the price as a number, like 1.5.");
    type("Update plan", /^Price \(/, "1.5");
    expect(fieldError("Update plan", /^Price \(/)).toBeNull();
    expect(fieldError("Update plan", "Duration (seconds)")).toBeNull();
    await click("Save plan");
    expect(fieldError("Update plan", "Duration (seconds)")).toBe("Enter a duration in seconds, like 2592000.");
    expect(document.activeElement).toBe(card("Update plan").getByLabelText("Duration (seconds)"));
  });

  it("replaces a validation error with the transaction error, and clears it on success", async () => {
    renderPage();
    await click("Save plan");
    state.writeImpl = () => Promise.reject(new Error("reverted"));
    await click("Pause payments");
    expect(fieldError("Update plan", /^Price \(/)).toBeNull();
    expect(alertText()).toEqual([FAILED]);
    state.writeImpl = () => Promise.resolve("0xhash");
    await click("Pause payments");
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
    type("Withdraw ETH", "Destination address", DESTINATION);
    type("Withdraw ETH", "Amount (ETH)", "1.25");
    expect(await click("Withdraw ETH")).toEqual([
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

  it("transfers ownership to the typed address after the confirm dialog", async () => {
    renderPage();
    type("Transfer ownership", "New owner address", NEW_OWNER);
    expect(await click("Transfer ownership")).toEqual([]);
    expect(screen.getByRole("alertdialog", { name: "Transfer ownership to 0x5555...5555?" })).toBeDefined();
    expect(await settle(() => fireEvent.click(dialog().getByRole("button", { name: "Transfer ownership" })))).toEqual([
      ["writeContractAsync", { functionName: "transferOwnership", args: [NEW_OWNER] }],
      ...REFETCH_ALL,
    ]);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("opens the confirm dialog, not the wallet, on Enter in the new owner field", async () => {
    renderPage();
    type("Transfer ownership", "New owner address", NEW_OWNER);
    const form = card("Transfer ownership").getByLabelText("New owner address").closest("form") as HTMLFormElement;
    expect(await settle(() => fireEvent.submit(form))).toEqual([]);
    expect(dialog().getByRole("button", { name: "Keep ownership" })).toBe(document.activeElement);
  });

  it("keeps ownership: the dialog's keep button closes it and sends nothing", async () => {
    renderPage();
    type("Transfer ownership", "New owner address", NEW_OWNER);
    await click("Transfer ownership");
    expect(await settle(() => fireEvent.click(dialog().getByRole("button", { name: "Keep ownership" })))).toEqual([]);
    expect(screen.queryByRole("alertdialog")).toBeNull();
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
    expect(card(cardTitle).getByText("Loading token decimals")).toBeDefined();
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
