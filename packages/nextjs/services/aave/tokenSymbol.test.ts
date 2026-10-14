import {
  type Hex,
  createPublicClient,
  custom,
  decodeFunctionData,
  encodeFunctionResult,
  multicall3Abi,
  stringToHex,
} from "viem";
import { mainnet } from "viem/chains";
import { beforeEach, describe, expect, it } from "vitest";
import { ERC20_ABI } from "~~/config/aaveConfig";
import { decodeBytes32Symbol, readTokenSymbol } from "~~/services/aave/tokenSymbol";

const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const MKR = "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2";
const NO_SYMBOL = "0x000000000000000000000000000000000000dEaD";
const NO_CODE = "0x000000000000000000000000000000000000c0DE";

const USDC_RETURN_DATA = encodeFunctionResult({ abi: ERC20_ABI, functionName: "symbol", result: "USDC" });

// What each address's symbol() returns on chain. MKR predates the ERC-20 string convention and returns bytes32; an
// address without code returns no data; any other address reverts.
const SYMBOL_RETURN_DATA: Record<string, Hex> = {
  [USDC.toLowerCase()]: USDC_RETURN_DATA,
  [MKR.toLowerCase()]: stringToHex("MKR", { size: 32 }),
  [NO_CODE.toLowerCase()]: "0x",
};

const symbolReturnData = (to: string) => SYMBOL_RETURN_DATA[to.toLowerCase()];

let ethCalls: string[] = [];

type NodeRequest = (args: { method: string; params?: unknown }) => Promise<unknown>;

// A real viem client whose node is a local function, so encoding and decoding run exactly as against a live RPC.
const createNodeClient = (request: NodeRequest) =>
  // Every failure here is final; viem would otherwise retry it.
  createPublicClient({ chain: mainnet, transport: custom({ request }, { retryCount: 0 }) });

const client = createNodeClient(async ({ method, params }) => {
  if (method !== "eth_call") throw new Error(`Unexpected RPC method ${method}`);
  const [{ to }] = params as [{ to: string }];
  ethCalls.push(to);
  const data = symbolReturnData(to);
  if (data === undefined) throw new Error("execution reverted");
  return data;
});

describe("readTokenSymbol", () => {
  beforeEach(() => {
    ethCalls = [];
  });

  it("reads a string symbol with a single call", async () => {
    await expect(readTokenSymbol(client, USDC)).resolves.toBe("USDC");
    expect(ethCalls).toEqual([USDC]);
  });

  it("decodes MKR's bytes32 symbol, which the string ABI cannot decode, from the same call", async () => {
    // B1.0: the failed string decode used to drop MKR's row.
    await expect(client.readContract({ address: MKR, abi: ERC20_ABI, functionName: "symbol" })).rejects.toThrow();

    ethCalls = [];
    await expect(readTokenSymbol(client, MKR)).resolves.toBe("MKR");
    expect(ethCalls).toEqual([MKR]);
  });

  it("rejects a reverted symbol() without calling it again", async () => {
    await expect(readTokenSymbol(client, NO_SYMBOL)).rejects.toThrow();
    expect(ethCalls).toEqual([NO_SYMBOL]);
  });

  it("rejects an address that returns no data", async () => {
    await expect(readTokenSymbol(client, NO_CODE)).rejects.toThrow();
    expect(ethCalls).toEqual([NO_CODE]);
  });

  it("rejects a failed call instead of decoding a later string answer as bytes32", async () => {
    // A retry after a transport error decoded the string's ABI offset word as bytes32, showing the symbol " ".
    const answers = [() => Promise.reject(new Error("fetch failed")), () => Promise.resolve(USDC_RETURN_DATA)];
    let calls = 0;
    const flakyClient = createNodeClient(async () => answers[calls++]());

    await expect(readTokenSymbol(flakyClient, USDC)).rejects.toThrow("fetch failed");
    expect(calls).toBe(1);
  });
});

describe("readTokenSymbol with multicall batching, as the positions fetcher reads it", () => {
  let aggregate3Calls: { to: string; targets: string[] }[] = [];

  // The node answers Multicall3's aggregate3 per target, reporting a revert as a failed call.
  const batchingClient = createPublicClient({
    chain: mainnet,
    batch: { multicall: true },
    transport: custom(
      {
        request: async ({ method, params }) => {
          if (method !== "eth_call") throw new Error(`Unexpected RPC method ${method}`);
          const [{ to, data }] = params as [{ to: string; data: Hex }];
          const { functionName, args } = decodeFunctionData({ abi: multicall3Abi, data });
          if (functionName !== "aggregate3") throw new Error(`Unexpected Multicall3 function ${functionName}`);
          const [calls] = args;
          aggregate3Calls.push({ to, targets: calls.map(call => call.target) });
          return encodeFunctionResult({
            abi: multicall3Abi,
            functionName: "aggregate3",
            result: calls.map(({ target }) => {
              const returnData = symbolReturnData(target);
              return { success: returnData !== undefined, returnData: returnData ?? "0x" };
            }),
          });
        },
      },
      { retryCount: 0 },
    ),
  });

  beforeEach(() => {
    aggregate3Calls = [];
  });

  it("reads string and bytes32 symbols in one aggregate3 call", async () => {
    await expect(
      Promise.all([readTokenSymbol(batchingClient, USDC), readTokenSymbol(batchingClient, MKR)]),
    ).resolves.toEqual(["USDC", "MKR"]);
    expect(aggregate3Calls).toEqual([{ to: mainnet.contracts.multicall3.address, targets: [USDC, MKR] }]);
  });

  it("rejects only the reverted read of a batch", async () => {
    const results = await Promise.allSettled([
      readTokenSymbol(batchingClient, USDC),
      readTokenSymbol(batchingClient, NO_SYMBOL),
    ]);

    expect(results.map(result => result.status)).toEqual(["fulfilled", "rejected"]);
    expect(results[0]).toEqual({ status: "fulfilled", value: "USDC" });
    expect(aggregate3Calls).toEqual([{ to: mainnet.contracts.multicall3.address, targets: [USDC, NO_SYMBOL] }]);
  });
});

describe("decodeBytes32Symbol", () => {
  it.each([
    ["a NUL-padded symbol", stringToHex("MKR", { size: 32 }), "MKR"],
    ["a symbol filling all 32 bytes", stringToHex("A".repeat(32)), "A".repeat(32)],
    ["an all-zero value", stringToHex("", { size: 32 }), ""],
  ])("decodes %s", (_, value, symbol) => {
    expect(decodeBytes32Symbol(value)).toBe(symbol);
  });
});
