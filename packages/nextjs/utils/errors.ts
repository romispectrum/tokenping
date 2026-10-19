export const getErrorMessage = (error: unknown, fallback = "Unknown error") =>
  error instanceof Error && error.message ? error.message : fallback;

/**
 * Whether a wallet error means the person declined the request: EIP-1193 code 4001, which viem and wagmi wrap as
 * UserRejectedRequestError somewhere in the error's cause chain.
 */
export const isUserRejection = (error: unknown) => {
  let current = error;
  // Bounded, in case a cause chain loops.
  for (let depth = 0; depth < 10 && typeof current === "object" && current !== null; depth++) {
    const { name, code, cause } = current as { name?: unknown; code?: unknown; cause?: unknown };
    if (name === "UserRejectedRequestError" || code === 4001) return true;
    current = cause;
  }
  return false;
};
