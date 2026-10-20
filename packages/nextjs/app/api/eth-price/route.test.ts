import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, revalidate } from "~~/app/api/eth-price/route";
import { ETH_PRICE_REVALIDATE_SECONDS, readEthPrice } from "~~/services/marketing/ethPrice";

vi.mock("~~/services/marketing/ethPrice", async importOriginal => ({
  ...(await importOriginal<typeof import("~~/services/marketing/ethPrice")>()),
  readEthPrice: vi.fn(),
}));

afterEach(() => {
  vi.mocked(readEthPrice).mockReset();
});

describe("GET /api/eth-price", () => {
  it("answers the price as JSON", async () => {
    vi.mocked(readEthPrice).mockResolvedValue(2383.21);
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ price: 2383.21 });
  });

  // A 5xx here would be a failed request in every visitor's console, the error this route exists to avoid.
  it("still answers 200 when the chain cannot be read, with a null price", async () => {
    vi.mocked(readEthPrice).mockResolvedValue(null);
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ price: null });
  });

  it("is regenerated at the price's revalidation interval", () => {
    expect(revalidate).toBe(ETH_PRICE_REVALIDATE_SECONDS);
  });
});
