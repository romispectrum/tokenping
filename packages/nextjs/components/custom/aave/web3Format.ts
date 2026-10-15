import { getAddress } from "viem";

/**
 * `0x1234...abcd`: the first `start` and last `end` characters with three ASCII dots between them. Never ask anyone
 * to read or type a value from this form; the full value goes in `title` and the accessible name.
 */
export const shortenHex = (value: string, { start = 6, end = 4 } = {}) =>
  value.length <= start + end + 3 ? value : `${value.slice(0, start)}...${value.slice(-end)}`;

/** The EIP-55 checksummed form for display (addresses are stored lowercased); the input itself when it is not valid. */
export const toDisplayAddress = (address: string) => {
  try {
    return getAddress(address);
  } catch {
    return address;
  }
};
