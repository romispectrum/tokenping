import { AAVE_CHAINS } from "~~/config/aaveConfig";
import { MORPHO_CHAINS } from "~~/config/morpho";

/**
 * Every network Tokenping reads, each once by chain id: Aave's, then the Morpho networks Aave does not cover. The
 * homepage's logo strip and coverage grid, the site-wide network count and the network logo script use it.
 */
export const SUPPORTED_NETWORKS = [
  ...AAVE_CHAINS,
  ...MORPHO_CHAINS.filter(({ chain }) => !AAVE_CHAINS.some(aave => aave.chain.id === chain.id)),
].map(({ chain, name }) => ({ chain, name }));
