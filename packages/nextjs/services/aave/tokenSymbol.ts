import { type Address, type Hex, type PublicClient, decodeFunctionResult, encodeFunctionData, hexToString } from "viem";
import { ERC20_ABI, ERC20_BYTES32_SYMBOL_ABI } from "~~/config/aaveConfig";

const SYMBOL_CALLDATA = encodeFunctionData({ abi: ERC20_ABI, functionName: "symbol" });

/** hexToString with a size trims trailing zero bytes but keeps one, so an all-zero value would decode to "\0". */
export const decodeBytes32Symbol = (value: Hex) => hexToString(value, { size: 32 }).replace(/\0/g, "");

/**
 * Reads an ERC-20 symbol with one call and decodes the return data as a string, or as bytes32 when it is not a string
 * (MKR). A failed call rejects as it is: calling again sends the same calldata, so it cannot help.
 */
export const readTokenSymbol = async (client: Pick<PublicClient, "call">, asset: Address) => {
  const { data = "0x" } = await client.call({ to: asset, data: SYMBOL_CALLDATA });
  try {
    return decodeFunctionResult({ abi: ERC20_ABI, functionName: "symbol", data });
  } catch {
    return decodeBytes32Symbol(decodeFunctionResult({ abi: ERC20_BYTES32_SYMBOL_ABI, functionName: "symbol", data }));
  }
};
