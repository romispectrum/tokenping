import { beforeEach, describe, expect, it, vi } from "vitest";
import Debug, { generateMetadata } from "~~/app/(en)/debug/page";
import { renderMarkup } from "~~/utils/testing/render";

const state = vi.hoisted(() => ({ devRoutesEnabled: false }));

const NOT_FOUND = "NEXT_HTTP_ERROR_FALLBACK;404";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error(NOT_FOUND);
  },
}));
vi.mock("~~/utils/devRoutes", async importOriginal => ({
  ...(await importOriginal<typeof import("~~/utils/devRoutes")>()),
  areDevRoutesEnabled: () => state.devRoutesEnabled,
}));
vi.mock("~~/app/(en)/debug/_components/DebugContracts", () => ({
  DebugContracts: () => <div data-stub="debug-contracts" />,
}));

describe("/debug", () => {
  beforeEach(() => {
    state.devRoutesEnabled = false;
  });

  it("is a 404 outside local hardhat builds", () => {
    expect(() => renderMarkup(<Debug />)).toThrow(NOT_FOUND);
  });

  // Next sends the route's metadata to the browser with the 404, which would retitle the hydrated 404 page.
  it("keeps the 404's title outside local hardhat builds", () => {
    expect(generateMetadata()).toEqual({ title: { default: "Page not found", template: "%s | Tokenping" } });
  });

  it("renders the contract debugger on the local chain", () => {
    state.devRoutesEnabled = true;

    expect(renderMarkup(<Debug />)).toContain('<div data-stub="debug-contracts">');
    expect(generateMetadata().title).toBe("Debug Contracts");
  });
});
