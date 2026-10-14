import { type Address, isAddress, parseEther, parseUnits } from "viem";

// Parsers are annotated: inferred object-literal unions gain optional keys, which breaks `"error" in result` narrowing.
export type ParseResult<T> = { error: string } | { value: T };

// BUG(B2.4): also used while the decimals read is loading or failed, so an 18-decimals amount is mis-scaled.
export const FALLBACK_TOKEN_DECIMALS = 6;

export type PlanForm = {
  tokenAddress: string;
  price: string;
  durationSeconds: string;
  enabled: boolean;
};

export type NativeWithdrawForm = {
  to: string;
  amountEth: string;
};

export type TokenWithdrawForm = {
  tokenAddress: string;
  to: string;
  amount: string;
};

const tryParse = <T>(parse: () => T, error: string): ParseResult<T> => {
  try {
    return { value: parse() };
  } catch {
    return { error };
  }
};

/** `setPlan` args. */
export const parsePlanForm = (
  { tokenAddress, price, durationSeconds, enabled }: PlanForm,
  decimals?: number,
): ParseResult<readonly [Address, bigint, bigint, boolean]> => {
  if (!isAddress(tokenAddress)) return { error: "Enter a valid token address for plan update" };
  if (!price || !durationSeconds) return { error: "Enter plan price and duration" };
  return tryParse(
    () =>
      [tokenAddress, parseUnits(price, decimals ?? FALLBACK_TOKEN_DECIMALS), BigInt(durationSeconds), enabled] as const,
    "Invalid plan values",
  );
};

/** `setMaxDurationSeconds` arg. */
export const parseMaxDuration = (durationSeconds: string): ParseResult<bigint> => {
  if (!durationSeconds) return { error: "Enter max duration in seconds" };
  return tryParse(() => BigInt(durationSeconds), "Invalid max duration");
};

/** `withdrawNative` args. */
export const parseNativeWithdraw = ({ to, amountEth }: NativeWithdrawForm): ParseResult<readonly [Address, bigint]> => {
  if (!isAddress(to)) return { error: "Enter a valid destination address for native withdraw" };
  if (!amountEth) return { error: "Enter native amount in ETH" };
  return tryParse(() => [to, parseEther(amountEth)] as const, "Invalid ETH amount");
};

/** `withdrawTokens` args. */
export const parseTokenWithdraw = (
  { tokenAddress, to, amount }: TokenWithdrawForm,
  decimals?: number,
): ParseResult<readonly [Address, Address, bigint]> => {
  if (!isAddress(tokenAddress)) return { error: "Enter a valid token address" };
  if (!isAddress(to)) return { error: "Enter a valid destination address for token withdraw" };
  if (!amount) return { error: "Enter token amount" };
  return tryParse(
    () => [tokenAddress, to, parseUnits(amount, decimals ?? FALLBACK_TOKEN_DECIMALS)] as const,
    "Invalid token amount",
  );
};

/** `transferOwnership` arg. */
export const parseNewOwner = (newOwner: string): ParseResult<Address> =>
  isAddress(newOwner) ? { value: newOwner } : { error: "Enter a valid new owner address" };
