import { beforeEach, describe, expect, it, vi } from "vitest";
import BlockExplorerLayout, { generateMetadata } from "~~/app/blockexplorer/layout";
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

const renderLayout = () => renderMarkup(<BlockExplorerLayout>explorer page</BlockExplorerLayout>);

describe("/blockexplorer layout", () => {
  beforeEach(() => {
    state.devRoutesEnabled = false;
  });

  // The address and transaction pages repeat the check (pages.test.tsx), since Next renders them in parallel.
  it("is a 404 outside local hardhat builds", () => {
    expect(renderLayout).toThrow(NOT_FOUND);
  });

  // Next sends the layout's metadata to the browser with the 404, which would retitle the hydrated 404 page. A string
  // title would also drop the root template from the not-found page below ("Page not found" without the suffix).
  it("keeps the 404's title, with the site suffix, outside local hardhat builds", () => {
    expect(generateMetadata()).toEqual({ title: { default: "Page not found", template: "%s | Tokenping" } });
  });

  it("passes the site title template down to the explorer pages on the local chain", () => {
    state.devRoutesEnabled = true;

    expect(generateMetadata().title).toEqual({ default: "Block Explorer", template: "%s | Tokenping" });
  });

  it("renders its pages on the local chain", () => {
    state.devRoutesEnabled = true;

    expect(renderLayout()).toBe("explorer page");
  });
});
