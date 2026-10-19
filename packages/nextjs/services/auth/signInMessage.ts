import { type Chain, getAddress } from "viem";
import { mainnet } from "viem/chains";
import { createSiweMessage } from "viem/siwe";
import { AAVE_CHAINS } from "~~/config/aaveConfig";
import scaffoldConfig from "~~/scaffold.config";

// Sign-in with Ethereum (EIP-4361), shared by the browser, which writes the message, and the verify route, which
// checks it. The wallet signs one message per sign-in; the server then sets a session cookie for that wallet.

/** How long a nonce, and the message that carries it, can be used. Signing takes seconds; five minutes is generous. */
export const SIGN_IN_TTL_SECONDS = 5 * 60;

/**
 * The chains a sign-in may name: the site's own networks, Ethereum, and every chain with an Aave market Tokenping
 * reads. A smart wallet's signature is checked on the chain the message names (EIP-4361: where a contract account
 * must be resolved), so the server needs an RPC for each one.
 */
export const SIGN_IN_CHAINS: readonly Chain[] = [
  ...new Map(
    [...scaffoldConfig.targetNetworks, mainnet, ...AAVE_CHAINS.map(({ chain }) => chain)].map(chain => [
      chain.id,
      chain,
    ]),
  ).values(),
];

export const getSignInChain = (chainId: number | undefined) => SIGN_IN_CHAINS.find(({ id }) => id === chainId);

/** The wallet's connected chain when the server can check signatures there, otherwise the site's first network. */
export const signInChainId = (connectedChainId: number | undefined) =>
  getSignInChain(connectedChainId)?.id ?? scaffoldConfig.targetNetworks[0].id;

type SignInMessageInput = {
  address: string;
  chainId: number;
  nonce: string;
  /** The human-readable line the wallet shows, in the page's language. */
  statement: string;
  /** The page's origin, e.g. https://tokenping.xyz: the message's URI, and its domain is the origin's host. */
  origin: string;
  now: Date;
};

export const buildSignInMessage = ({ address, chainId, nonce, statement, origin, now }: SignInMessageInput) =>
  createSiweMessage({
    domain: new URL(origin).host,
    uri: origin,
    // EIP-4361 asks for the EIP-55 checksummed address.
    address: getAddress(address),
    chainId,
    nonce,
    statement,
    version: "1",
    issuedAt: now,
    expirationTime: new Date(now.getTime() + SIGN_IN_TTL_SECONDS * 1000),
  });
