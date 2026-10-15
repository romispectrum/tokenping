import { type Address, isAddress, parseEther, parseUnits } from "viem";

// Parsers are annotated: inferred object-literal unions gain optional keys, which breaks `"error" in result` narrowing.
/** A parsed value, or the message for the first field that cannot be parsed (shown at that field). */
export type ParseResult<T, F extends string = string> = { error: string; field: F } | { value: T };

// Display only: balances and the current price are shown with 6 decimals until the token's decimals are read.
// Transactions never use it; they wait for the real decimals.
export const FALLBACK_TOKEN_DECIMALS = 6;

const DECIMALS_UNKNOWN_ERROR = "The token decimals have not loaded. Wait for them, or check the token address.";

export type PlanForm = {
  tokenAddress: string;
  price: string;
  durationSeconds: string;
  enabled: boolean;
};
export type PlanField = Exclude<keyof PlanForm, "enabled">;

export type MaxDurationField = "maxDurationSeconds";

export type NativeWithdrawForm = {
  to: string;
  amountEth: string;
};
export type NativeWithdrawField = keyof NativeWithdrawForm;

export type TokenWithdrawForm = {
  tokenAddress: string;
  to: string;
  amount: string;
};
export type TokenWithdrawField = keyof TokenWithdrawForm;

export type NewOwnerField = "newOwner";

const tryParse = <T, F extends string>(parse: () => T, field: F, error: string): ParseResult<T, F> => {
  try {
    return { value: parse() };
  } catch {
    return { error, field };
  }
};

/** `setPlan` args. */
export const parsePlanForm = (
  { tokenAddress, price, durationSeconds, enabled }: PlanForm,
  decimals: number | undefined,
): ParseResult<readonly [Address, bigint, bigint, boolean], PlanField> => {
  if (!isAddress(tokenAddress))
    return { error: "Enter the token address as a full 0x address.", field: "tokenAddress" };
  if (decimals === undefined) return { error: DECIMALS_UNKNOWN_ERROR, field: "tokenAddress" };
  if (!price) return { error: "Enter a price, like 1.5.", field: "price" };
  const parsedPrice = tryParse(() => parseUnits(price, decimals), "price", "Enter the price as a number, like 1.5.");
  if ("error" in parsedPrice) return parsedPrice;
  if (!durationSeconds) return { error: "Enter a duration in seconds, like 2592000.", field: "durationSeconds" };
  return tryParse(
    () => [tokenAddress, parsedPrice.value, BigInt(durationSeconds), enabled] as const,
    "durationSeconds",
    "Enter the duration as whole seconds, digits only.",
  );
};

/** `setMaxDurationSeconds` arg. */
export const parseMaxDuration = (durationSeconds: string): ParseResult<bigint, MaxDurationField> => {
  if (!durationSeconds)
    return { error: "Enter a max duration in seconds, like 31536000.", field: "maxDurationSeconds" };
  return tryParse(
    () => BigInt(durationSeconds),
    "maxDurationSeconds",
    "Enter the max duration as whole seconds, digits only.",
  );
};

/** `withdrawNative` args. */
export const parseNativeWithdraw = ({
  to,
  amountEth,
}: NativeWithdrawForm): ParseResult<readonly [Address, bigint], NativeWithdrawField> => {
  if (!isAddress(to)) return { error: "Enter the destination as a full 0x address.", field: "to" };
  if (!amountEth) return { error: "Enter an amount in ETH, like 0.5.", field: "amountEth" };
  return tryParse(() => [to, parseEther(amountEth)] as const, "amountEth", "Enter the amount as a number, like 0.5.");
};

/** `withdrawTokens` args. */
export const parseTokenWithdraw = (
  { tokenAddress, to, amount }: TokenWithdrawForm,
  decimals: number | undefined,
): ParseResult<readonly [Address, Address, bigint], TokenWithdrawField> => {
  if (!isAddress(tokenAddress))
    return { error: "Enter the token address as a full 0x address.", field: "tokenAddress" };
  if (decimals === undefined) return { error: DECIMALS_UNKNOWN_ERROR, field: "tokenAddress" };
  if (!isAddress(to)) return { error: "Enter the destination as a full 0x address.", field: "to" };
  if (!amount) return { error: "Enter an amount, like 10.", field: "amount" };
  return tryParse(
    () => [tokenAddress, to, parseUnits(amount, decimals)] as const,
    "amount",
    "Enter the amount as a number, like 10.",
  );
};

/** `transferOwnership` arg. */
export const parseNewOwner = (newOwner: string): ParseResult<Address, NewOwnerField> =>
  isAddress(newOwner) ? { value: newOwner } : { error: "Enter the new owner as a full 0x address.", field: "newOwner" };
