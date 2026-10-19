import { UserRejectedRequestError } from "viem";
import { describe, expect, it } from "vitest";
import { getErrorMessage, isUserRejection } from "~~/utils/errors";

describe("getErrorMessage", () => {
  it("returns the message of an Error", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("returns the message of Error subclasses", () => {
    expect(getErrorMessage(new TypeError("bad type"), "fallback")).toBe("bad type");
  });

  it("uses 'Unknown error' as the default fallback", () => {
    expect(getErrorMessage("nope")).toBe("Unknown error");
  });

  it("falls back for an Error with an empty message", () => {
    // Differs from the inline `e instanceof Error ? e.message : fallback`, which returns "".
    expect(getErrorMessage(new Error(""), "fallback")).toBe("fallback");
  });

  it("keeps a whitespace-only message (only empty is falsy)", () => {
    expect(getErrorMessage(new Error(" "), "fallback")).toBe(" ");
  });

  it("falls back for non-Error values, even objects with a message", () => {
    // Differs from the inline `error?.message || fallback`, which accepts plain objects.
    expect(getErrorMessage({ message: "plain object" }, "fallback")).toBe("fallback");
    expect(getErrorMessage("string error", "fallback")).toBe("fallback");
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback");
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
    expect(getErrorMessage(42, "fallback")).toBe("fallback");
  });

  it("allows an empty fallback", () => {
    expect(getErrorMessage(null, "")).toBe("");
  });
});

describe("isUserRejection", () => {
  it.each([
    ["viem's UserRejectedRequestError", new UserRejectedRequestError(new Error("User rejected the request."))],
    ["an EIP-1193 error with code 4001", Object.assign(new Error("User denied message signature."), { code: 4001 })],
    [
      "a wrapper whose cause is a rejection",
      new Error("SignMessageError", { cause: new Error("x", { cause: { code: 4001 } }) }),
    ],
  ])("recognises %s", (_label, error) => {
    expect(isUserRejection(error)).toBe(true);
  });

  it.each([
    ["another error", new Error("Connector not connected.")],
    ["another code", Object.assign(new Error("Internal"), { code: -32603 })],
    ["a string", "rejected"],
    ["null", null],
    ["undefined", undefined],
  ])("does not count %s", (_label, error) => {
    expect(isUserRejection(error)).toBe(false);
  });

  it("stops on a cause chain that loops", () => {
    const looped: { cause?: unknown } = {};
    looped.cause = looped;
    expect(isUserRejection(looped)).toBe(false);
  });
});
