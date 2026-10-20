import type { Chain } from "viem";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DAI_WETH_PAIR, readEthPrice } from "~~/services/marketing/ethPrice";

const mocks = vi.hoisted(() => ({ readContract: vi.fn(), createPublicClient: vi.fn() }));

// Only the client is mocked: the transport is the real one, and building it sends no request.
vi.mock("viem", async importOriginal => ({
  ...(await importOriginal<typeof import("viem")>()),
  createPublicClient: mocks.createPublicClient,
}));

const ETHER = 10n ** 18n;

beforeEach(() => {
  mocks.readContract.mockReset();
  mocks.createPublicClient.mockReset().mockImplementation(() => ({ readContract: mocks.readContract }));
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("readEthPrice", () => {
  it("divides the pool's DAI reserve by its WETH reserve, to the cent", async () => {
    // 4,473,291.123456789 DAI against 1,877 WETH
    mocks.readContract.mockResolvedValue([4_473_291_123_456_789n * 10n ** 9n, 1_877n * ETHER, 1_792_491_995]);

    await expect(readEthPrice()).resolves.toBe(2383.21);
    expect(mocks.readContract).toHaveBeenCalledWith(
      expect.objectContaining({ address: DAI_WETH_PAIR, functionName: "getReserves" }),
    );
  });

  it("reads Ethereum mainnet", async () => {
    mocks.readContract.mockResolvedValue([3000n * ETHER, ETHER, 0]);

    await readEthPrice();

    expect((mocks.createPublicClient.mock.calls[0]?.[0] as { chain: Chain }).chain.id).toBe(1);
  });

  it("is null, and logs on the server, when the chain cannot be read", async () => {
    mocks.readContract.mockRejectedValue(new Error("HTTP request failed. Status: 429"));

    await expect(readEthPrice()).resolves.toBeNull();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("readEthPrice"), expect.any(Error));
  });

  it("is null for an empty pool rather than dividing by zero", async () => {
    mocks.readContract.mockResolvedValue([0n, 0n, 0]);

    await expect(readEthPrice()).resolves.toBeNull();
  });
});
