import { type Address, erc20Abi } from "viem";
import { useReadContract } from "wagmi";

/** Two single reads rather than one multicall, so each shares its query cache with other reads of the same call. */
export const useErc20Metadata = (address: Address | undefined, chainId: number | undefined) => {
  const query = { enabled: Boolean(address) };
  const { data: decimals } = useReadContract({ abi: erc20Abi, address, functionName: "decimals", chainId, query });
  const { data: symbol } = useReadContract({ abi: erc20Abi, address, functionName: "symbol", chainId, query });
  return { decimals, symbol };
};
