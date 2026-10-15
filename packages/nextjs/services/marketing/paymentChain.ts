import type { Chain } from "viem";
import { PAYMENT_CHAIN_ID } from "~~/constants/payments";
import scaffoldConfig from "~~/scaffold.config";

/** The name of `chainId` among `networks` ("Arbitrum One"); undefined without a chain id or a matching network. */
export const findChainName = (chainId: number | undefined, networks: readonly Chain[]) =>
  chainId === undefined ? undefined : networks.find(({ id }) => id === chainId)?.name;

/**
 * The network alerts are paid on, as copy names it: the target network that constants/payments pins every paywall
 * read and write to. Undefined when no target network has a paywall.
 */
export const getPaymentChainName = () => findChainName(PAYMENT_CHAIN_ID, scaffoldConfig.targetNetworks);
