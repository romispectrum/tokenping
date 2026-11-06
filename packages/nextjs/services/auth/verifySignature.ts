import "server-only";
import { type Address, type Chain, type Hex, createPublicClient, isAddressEqual, recoverMessageAddress } from "viem";
import { PAYMENT_CHAIN_ID } from "~~/constants/payments";
import { getConfiguredTransport } from "~~/utils/rpc";

type SignatureCheck = { chain: Chain; address: Address; message: string; signature: Hex };

/** Whether an ordinary (EOA) signature of `message` recovers to `address`, without asking any RPC. */
const recoversTo = async ({ address, message, signature }: Omit<SignatureCheck, "chain">) => {
  try {
    return isAddressEqual(await recoverMessageAddress({ message, signature }), address);
  } catch {
    // Not an ECDSA signature: an ERC-1271 or ERC-6492 one from a smart wallet.
    return false;
  }
};

/**
 * Whether `address` signed `message` (EIP-191). An ordinary wallet's signature is recovered locally, so no RPC can
 * vouch for a wallet it does not hold. Anything else is a smart wallet's: viem's verifyMessage asks the chain through
 * an eth_call (ERC-1271 for a deployed account, ERC-6492 for one not deployed yet), and only through the app's own
 * endpoints (rpcOverrides, its own Alchemy key): a public RPC that answered "valid" would sign anyone in. On a chain
 * without one, smart wallet signatures are refused. No retries: someone is waiting.
 *
 * A session stands for an address on every chain, but who controls a smart wallet is decided per chain: an owner removed
 * on one chain can still sign on another. So a smart wallet signs in on the payment chain only, the one its paid access
 * lives on. An ordinary wallet has the same key everywhere and can sign in on any listed chain.
 */
export const verifyWalletSignature = async ({ chain, address, message, signature }: SignatureCheck) => {
  if (await recoversTo({ address, message, signature })) return true;
  if (chain.id !== PAYMENT_CHAIN_ID) return false;
  const transport = getConfiguredTransport(chain.id, { retryCount: 0 });
  if (!transport) {
    console.error(
      `verifyWalletSignature: no RPC of the app's own on chain ${chain.id}, so a smart wallet signature cannot be checked. Set NEXT_PUBLIC_ALCHEMY_API_KEY or an rpcOverrides entry.`,
    );
    return false;
  }
  return createPublicClient({ chain, transport }).verifyMessage({ address, message, signature });
};
