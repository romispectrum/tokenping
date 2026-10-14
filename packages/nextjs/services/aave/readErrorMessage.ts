import { BaseError } from "viem";
import { getErrorMessage } from "~~/utils/errors";

/**
 * A one-line reason for a failed RPC read, for logs. A viem error's full message embeds the request body (kilobytes of
 * multicall calldata per failure) and docs links, so its shortMessage is used instead.
 */
export const getReadErrorMessage = (error: unknown) =>
  error instanceof BaseError && error.shortMessage ? error.shortMessage : getErrorMessage(error);
