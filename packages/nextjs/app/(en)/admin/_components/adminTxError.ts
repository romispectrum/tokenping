/**
 * What a failed admin transaction tells the owner. "neutral" is the owner's own choice (a cancel is not an error),
 * "warning" a state they can fix, "destructive" a real failure.
 */
export type AdminTxError = {
  tone: "neutral" | "warning" | "destructive";
  title: string;
  message: string;
};

type ErrorLike = {
  code?: unknown;
  name?: unknown;
  message?: unknown;
  shortMessage?: unknown;
  reason?: unknown;
  data?: { errorName?: unknown };
  cause?: unknown;
};

/** The error and its causes: viem wraps the wallet's or the contract's error several levels deep. */
const errorChain = (error: unknown) => {
  const chain: ErrorLike[] = [];
  let current = error;
  while (current && typeof current === "object" && chain.length < 10) {
    chain.push(current as ErrorLike);
    current = (current as ErrorLike).cause;
  }
  return chain;
};

// The TokenpingPaywall require() strings and the OpenZeppelin errors its admin functions can revert with, as the
// sentence the owner reads. The simulation SE-2 runs before the wallet opens catches almost all of them.
const REVERT_MESSAGES: Record<string, string> = {
  "Duration too long": "The duration is longer than the current max duration. Raise the max duration first.",
  "Duration must be > 0": "Enter a duration of at least 1 second.",
  "Price must be > 0": "Enter a price above 0.",
  "Invalid maxDurationSeconds": "Enter a max duration of at least 1 second.",
  "Invalid token": "The token address cannot be the zero address.",
  "Invalid recipient": "The destination cannot be the zero address.",
  "Amount must be > 0": "Enter an amount above 0.",
  "Insufficient balance": "The contract does not hold that much. Enter an amount up to the contract balance.",
  "Native transfer failed": "The destination did not accept the ETH. Check that it can receive ETH.",
  OwnableUnauthorizedAccount: "This wallet is not the contract owner. Switch to the owner wallet.",
  OwnableInvalidOwner: "The new owner cannot be the zero address.",
  EnforcedPause: "Payments are already paused.",
  ExpectedPause: "Payments are not paused.",
};

const revertMessage = (chain: ErrorLike[]) => {
  for (const error of chain) {
    for (const key of [error.reason, error.data?.errorName]) {
      if (typeof key === "string" && REVERT_MESSAGES[key]) return REVERT_MESSAGES[key];
    }
  }
  return undefined;
};

type Context = {
  /** The payment network's name, "Arbitrum One". */
  network: string;
  /** Its fee currency, "ETH". */
  symbol: string;
};

/**
 * Classifies a wallet, RPC or contract error and words it for the owner. The raw error goes to the console, never
 * onto the page.
 */
export const describeAdminTxError = (error: unknown, { network, symbol }: Context): AdminTxError => {
  const chain = errorChain(error);
  const codes = chain.map(item => item.code);
  const names = chain.map(item => String(item.name ?? ""));
  const text = chain
    .map(item => `${String(item.name ?? "")} ${String(item.shortMessage ?? "")} ${String(item.message ?? "")}`)
    .join(" ")
    .toLowerCase();

  if (
    codes.includes(4001) ||
    names.includes("UserRejectedRequestError") ||
    /user (rejected|denied|cancel)|rejected the request|request rejected/.test(text)
  ) {
    return {
      tone: "neutral",
      title: "Request cancelled",
      message: "You cancelled the request in your wallet. Nothing was sent.",
    };
  }
  if (codes.includes(-32002) || /already pending/.test(text)) {
    return {
      tone: "warning",
      title: "Check your wallet",
      message: "Your wallet already has a request open. Approve or reject it there, then try again.",
    };
  }
  if (names.includes("InsufficientFundsError") || /insufficient funds/.test(text)) {
    return {
      tone: "warning",
      title: `Not enough ${symbol}`,
      message: `The owner wallet cannot cover the network fee. Add ${symbol} on ${network}, then try again.`,
    };
  }
  if (
    names.includes("ContractFunctionRevertedError") ||
    names.includes("ExecutionRevertedError") ||
    /reverted/.test(text)
  ) {
    return {
      tone: "destructive",
      title: "Transaction failed",
      message:
        revertMessage(chain) ??
        "The contract rejected this transaction, so nothing changed. The network fee was still spent if it reached the network.",
    };
  }
  if (names.includes("NonceTooLowError") || names.includes("NonceTooHighError") || /nonce too (low|high)/.test(text)) {
    return {
      tone: "warning",
      title: "Transaction out of order",
      message: "Your wallet has another transaction waiting. Let it finish, then try again.",
    };
  }
  if (
    /http request failed|timed out|timeout|fetch failed|failed to fetch|rate limit|\b429\b|\b503\b|internal json-rpc/.test(
      text,
    )
  ) {
    return {
      tone: "warning",
      title: "Network not responding",
      message: `We could not reach ${network}. Check the current values above before you try again.`,
    };
  }
  return {
    tone: "destructive",
    title: "Something went wrong",
    message: "The transaction did not complete. Check the current values above before you try again.",
  };
};
