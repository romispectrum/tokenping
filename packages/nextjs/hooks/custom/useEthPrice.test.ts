import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchEthPrice } from "~~/hooks/custom/useEthPrice";

const respond = (body: unknown, init?: ResponseInit) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), init));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchEthPrice", () => {
  it("reads the price from the site's own API, never a public RPC", async () => {
    const fetchMock = respond({ price: 2383.21 });

    await expect(fetchEthPrice()).resolves.toBe(2383.21);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/eth-price");
  });

  it("is null when the API has no price", async () => {
    respond({ price: null });

    await expect(fetchEthPrice()).resolves.toBeNull();
  });

  it("is null for an error response or a body that is not a positive number", async () => {
    respond({ price: 2383.21 }, { status: 500 });
    await expect(fetchEthPrice()).resolves.toBeNull();

    respond({ price: "2383.21" });
    await expect(fetchEthPrice()).resolves.toBeNull();

    respond({ price: 0 });
    await expect(fetchEthPrice()).resolves.toBeNull();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("<html>"));
    await expect(fetchEthPrice()).resolves.toBeNull();
  });

  // A blocked or offline request must not become a query error that react-query retries.
  it("is null when the request itself fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchEthPrice()).resolves.toBeNull();
  });
});
