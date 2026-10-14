import { BaseError, ContractFunctionExecutionError, HttpRequestError } from "viem";
import { describe, expect, it } from "vitest";
import { getReadErrorMessage } from "~~/services/aave/readErrorMessage";

const LARGE_CALLDATA = `0x${"ab".repeat(2_000)}`;

// What a failed eth_call through the fallback transport rejects with: the request body is part of the message.
const failedRead = () =>
  new ContractFunctionExecutionError(
    new HttpRequestError({
      url: "https://rpc.example",
      body: { method: "eth_call", params: [{ data: LARGE_CALLDATA }] },
      status: 429,
    }),
    { abi: [], functionName: "getUserAccountData", args: [] },
  );

describe("getReadErrorMessage", () => {
  it("returns a viem error's short message without the request body", () => {
    const error = failedRead();
    expect(error.message).toContain(LARGE_CALLDATA);

    expect(getReadErrorMessage(error)).toBe("HTTP request failed.");
  });

  it("falls back to the message of a viem error without a short message", () => {
    const error = new BaseError("");

    expect(getReadErrorMessage(error)).toBe(error.message);
  });

  it.each([
    ["an Error's message", new Error("rpc down"), "rpc down"],
    ["the fallback for a non-Error rejection", "rpc down", "Unknown error"],
  ])("returns %s for other errors", (_, error, message) => {
    expect(getReadErrorMessage(error)).toBe(message);
  });
});
