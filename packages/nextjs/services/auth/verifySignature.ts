import "server-only";
import { type Address, type Chain, type Hex, createPublicClient } from "viem";
import { getFallbackTransport } from "~~/utils/rpc";

type SignatureCheck = { chain: Chain; address: Address; message: string; signature: Hex };

/**
 * Whether `address` signed `message` (EIP-191). viem's public action checks smart wallets too: ERC-1271 for a deployed
 * account and ERC-6492 for one not deployed yet, through an eth_call on `chain`, and falls back to plain ECDSA recovery
 * when that call fails, so an ordinary wallet still signs in while the RPC is down. No retries: someone is waiting.
 */
export const verifyWalletSignature = ({ chain, address, message, signature }: SignatureCheck) =>
  createPublicClient({ chain, transport: getFallbackTransport(chain, { retryCount: 0 }) }).verifyMessage({
    address,
    message,
    signature,
  });
