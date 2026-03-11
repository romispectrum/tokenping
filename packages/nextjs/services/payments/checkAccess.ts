import { type Address, createPublicClient, http } from "viem";
import { hardhat } from "viem/chains";
import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

const CONTRACT_NAME = "TokenpingPaywall";

type DeployedContractsByChain = Record<
  number,
  Record<string, { address: string; abi: readonly unknown[] }> | undefined
>;

function getPaymentsChainId(): number | null {
  const chainIds = scaffoldConfig.targetNetworks.map(c => c.id);
  const contracts = deployedContracts as unknown as DeployedContractsByChain;
  for (const chainId of chainIds) {
    const chainContracts = contracts[chainId];
    if (chainContracts?.[CONTRACT_NAME]) return chainId;
  }
  return null;
}

function getPaymentsRpcUrl(chainId: number): string {
  const rpcOverride = (scaffoldConfig as { rpcOverrides?: Record<number, string> }).rpcOverrides?.[chainId];
  if (rpcOverride) return rpcOverride;
  if (chainId === hardhat.id) {
    return process.env.NEXT_PUBLIC_HARDHAT_RPC_URL ?? "http://127.0.0.1:8545";
  }
  const alchemyUrl = getAlchemyHttpUrl(chainId);
  if (alchemyUrl) return alchemyUrl;
  return "http://127.0.0.1:8545";
}

/**
 * Checks on-chain whether the user has active paid access (has paid and not expired).
 * Uses TokenpingPaywall.isActive(user) from the deployed contract.
 */
export async function isAccessActive(userAddress: string): Promise<boolean> {
  const chainId = getPaymentsChainId();
  if (chainId == null) return false;

  const contracts = deployedContracts as unknown as DeployedContractsByChain;
  const chainContracts = contracts[chainId];
  const contract = chainContracts?.[CONTRACT_NAME];
  if (!contract?.address || !contract?.abi) return false;

  const rpcUrl = getPaymentsRpcUrl(chainId);
  const chain = chainId === hardhat.id ? hardhat : scaffoldConfig.targetNetworks.find(c => c.id === chainId);
  if (!chain) return false;

  const client = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  try {
    const active = await client.readContract({
      address: contract.address as Address,
      abi: contract.abi as import("viem").Abi,
      functionName: "isActive",
      args: [userAddress as Address],
    });
    return active === true;
  } catch {
    return false;
  }
}
