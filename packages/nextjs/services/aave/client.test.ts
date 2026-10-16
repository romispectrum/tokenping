import { defineChain } from "viem";
import { mainnet, polygon } from "viem/chains";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAaveClient, createAaveClientCache } from "~~/services/aave/client";

type ClientOptions = { chain: { id: number }; transport: unknown; batch?: unknown };

const network = vi.hoisted(() => ({ clients: [] as ClientOptions[] }));

vi.mock("viem", async importOriginal => ({
  ...(await importOriginal<typeof import("viem")>()),
  createPublicClient: (options: ClientOptions) => {
    network.clients.push(options);
    return { clientNumber: network.clients.length };
  },
}));

vi.mock("~~/utils/rpc", () => ({ getFallbackTransport: (chain: { id: number }) => ({ fallbackFor: chain.id }) }));

beforeEach(() => {
  network.clients = [];
});

describe("createAaveClient", () => {
  it("creates a viem client on the chain with the shared fallback transport and multicall batching", () => {
    // B1.3, B1.5: the same RPC resolution as the alert cron; S1.17: parallel reads share multicalls.
    createAaveClient(polygon);

    expect(network.clients).toEqual([
      { chain: polygon, transport: { fallbackFor: polygon.id }, batch: { multicall: true } },
    ]);
  });
});

describe("createAaveClientCache", () => {
  it("creates one client per chain and returns it again for that chain", () => {
    const clientFor = createAaveClientCache();

    const ethereum = clientFor(mainnet);
    const polygonClient = clientFor(polygon);

    expect(clientFor(mainnet)).toBe(ethereum);
    expect(clientFor(polygon)).toBe(polygonClient);
    expect(polygonClient).not.toBe(ethereum);
    expect(network.clients.map(({ chain }) => chain.id)).toEqual([mainnet.id, polygon.id]);
  });

  it("tells chains apart by id, so two definitions of one chain share a client", () => {
    const clientFor = createAaveClientCache();

    expect(clientFor(defineChain({ ...mainnet }))).toBe(clientFor(mainnet));
    expect(network.clients).toHaveLength(1);
  });

  it("keeps each cache's clients to itself", () => {
    const first = createAaveClientCache();
    const second = createAaveClientCache();

    expect(first(mainnet)).not.toBe(second(mainnet));
    expect(network.clients).toHaveLength(2);
  });
});
