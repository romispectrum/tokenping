import {
  BaseError,
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  UserRejectedRequestError,
  encodeErrorResult,
  parseAbi,
} from "viem";
import { describe, expect, it } from "vitest";
import { describeAdminTxError } from "~~/app/(en)/admin/_components/adminTxError";

const CONTEXT = { network: "Arbitrum One", symbol: "ETH" };

const ABI = parseAbi([
  "function setPlan(address token, uint256 price, uint256 durationSeconds, bool enabled)",
  "error Error(string)",
  "error OwnableUnauthorizedAccount(address account)",
]);

/** The error viem's simulateContract throws for a revert: an execution error wrapping the decoded revert. */
const revertedWith = (data: `0x${string}`) =>
  new ContractFunctionExecutionError(
    new ContractFunctionRevertedError({ abi: ABI, data, functionName: "setPlan" }) as unknown as BaseError,
    { abi: ABI, functionName: "setPlan", args: [] },
  );

describe("describeAdminTxError", () => {
  it.each([
    ["an EIP-1193 4001", { code: 4001, message: "User denied transaction signature." }],
    ["viem's UserRejectedRequestError", new UserRejectedRequestError(new Error("rejected"))],
    ["a wrapped rejection", new BaseError("Request failed.", { cause: new UserRejectedRequestError(new Error("x")) })],
    ["a rejection message", new BaseError("User rejected the request.")],
  ])("treats %s as a neutral cancel", (_label, error) => {
    expect(describeAdminTxError(error, CONTEXT)).toEqual({
      tone: "neutral",
      title: "Request cancelled",
      message: "You cancelled the request in your wallet. Nothing was sent.",
    });
  });

  it("words a known require() reason from the contract", () => {
    const data = encodeErrorResult({ abi: ABI, errorName: "Error", args: ["Duration too long"] });
    expect(describeAdminTxError(revertedWith(data), CONTEXT)).toEqual({
      tone: "destructive",
      title: "Transaction failed",
      message: "The duration is longer than the current max duration. Raise the max duration first.",
    });
  });

  it("words a known custom error", () => {
    const data = encodeErrorResult({
      abi: ABI,
      errorName: "OwnableUnauthorizedAccount",
      args: ["0x2222222222222222222222222222222222222222"],
    });
    expect(describeAdminTxError(revertedWith(data), CONTEXT).message).toBe(
      "This wallet is not the contract owner. Switch to the owner wallet.",
    );
  });

  it.each([
    ["an unknown reason", revertedWith(encodeErrorResult({ abi: ABI, errorName: "Error", args: ["Nope"] }))],
    ["SE-2's on-chain revert", new Error("Transaction reverted")],
  ])("falls back to the plain revert sentence for %s, never the raw reason", (_label, error) => {
    const described = describeAdminTxError(error, CONTEXT);
    expect(described.title).toBe("Transaction failed");
    expect(described.message).toBe(
      "The contract rejected this transaction, so nothing changed. The network fee was still spent if it reached the network.",
    );
  });

  it("names the fee currency and network when the wallet cannot pay the fee", () => {
    expect(describeAdminTxError(new InsufficientFundsError(), CONTEXT)).toEqual({
      tone: "warning",
      title: "Not enough ETH",
      message: "The owner wallet cannot cover the network fee. Add ETH on Arbitrum One, then try again.",
    });
  });

  it.each([
    [{ code: -32002, message: "Request already pending" }, "Check your wallet"],
    [new BaseError("HTTP request failed."), "Network not responding"],
    [new BaseError("nonce too low"), "Transaction out of order"],
    [new Error("boom"), "Something went wrong"],
    ["a string", "Something went wrong"],
  ])("titles %j as %j", (error, title) => {
    expect(describeAdminTxError(error, CONTEXT).title).toBe(title);
  });
});
