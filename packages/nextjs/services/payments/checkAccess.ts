import { type Address, createPublicClient, http } from "viem";
import { hardhat } from "viem/chains";
import { PAYMENT_CHAIN_ID, getPaywallContract } from "~~/constants/payments";
import scaffoldConfig, { type ScaffoldConfig } from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth/networks";

const LOCAL_RPC_URL = "http://127.0.0.1:8545";

const getPaymentRpcUrl = (chainId: number) => {
  const rpcOverride = (scaffoldConfig.rpcOverrides as ScaffoldConfig["rpcOverrides"])?.[chainId];
  if (rpcOverride) return rpcOverride;
  if (chainId === hardhat.id) return process.env.NEXT_PUBLIC_HARDHAT_RPC_URL ?? LOCAL_RPC_URL;
  return getAlchemyHttpUrl(chainId) || LOCAL_RPC_URL;
};

/** Fails closed: any missing configuration or RPC error counts as no access. */
export const isAccessActive = async (userAddress: string): Promise<boolean> => {
  if (PAYMENT_CHAIN_ID === undefined) return false;
  const contract = getPaywallContract(PAYMENT_CHAIN_ID);
  if (!contract?.address || !contract.abi) return false;

  const chain = scaffoldConfig.targetNetworks.find(({ id }) => id === PAYMENT_CHAIN_ID);
  if (!chain) return false;

  const client = createPublicClient({ chain, transport: http(getPaymentRpcUrl(PAYMENT_CHAIN_ID)) });
  try {
    const active = await client.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "isActive",
      args: [userAddress as Address],
    });
    return active === true;
  } catch (error) {
    console.error(`isAccessActive: TokenpingPaywall.isActive read failed on chain ${PAYMENT_CHAIN_ID}`, error);
    return false;
  }
};
