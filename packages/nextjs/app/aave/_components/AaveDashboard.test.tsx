import { beforeEach, describe, expect, it, vi } from "vitest";
import { AaveDashboard } from "~~/app/aave/_components/AaveDashboard";
import { renderMarkup } from "~~/utils/testing/render";

const state = vi.hoisted(() => ({
  isClient: true,
  account: { address: undefined as string | undefined, isConnected: false },
}));

vi.mock("usehooks-ts", () => ({ useIsClient: () => state.isClient }));
vi.mock("wagmi", () => ({ useAccount: () => state.account }));
vi.mock("~~/components/custom/AavePositions", () => ({ AavePositions: () => <div data-stub="aave-positions" /> }));

const CONNECTED_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const POSITIONS_STUB = '<div data-stub="aave-positions">';

describe("AaveDashboard", () => {
  beforeEach(() => {
    state.isClient = true;
    state.account = { address: undefined, isConnected: false };
  });

  it("renders nothing before mounting on the client, so wallet state cannot cause a hydration mismatch", () => {
    state.isClient = false;

    expect(renderMarkup(<AaveDashboard />)).toBe("");
  });

  it("asks a disconnected visitor to connect a wallet, under the page's h1", () => {
    const html = renderMarkup(<AaveDashboard />);

    expect(html).not.toContain(POSITIONS_STUB);
    expect(html).not.toContain("<h1");
    expect(html).toContain(">Connect your wallet</h2>");
    expect(html).toMatchSnapshot();
  });

  it("renders the positions for a connected wallet", () => {
    state.account = { address: CONNECTED_ADDRESS, isConnected: true };

    expect(renderMarkup(<AaveDashboard />)).toMatchSnapshot();
  });

  // AavePositions, PositionDetails and the notification card use h3s, which would follow the page's h1 directly.
  it("gives a connected wallet's dashboard an h2 above the positions' h3 headings", () => {
    state.account = { address: CONNECTED_ADDRESS, isConnected: true };
    const html = renderMarkup(<AaveDashboard />);

    expect(html).toContain('<section aria-labelledby="your-positions" class="w-full">');
    expect(html).toContain('<h2 id="your-positions" class="sr-only">Your Aave positions</h2>');
    expect(html.indexOf("<h2")).toBeLessThan(html.indexOf(POSITIONS_STUB));
  });

  it("requires both a connection and an address", () => {
    state.account = { address: undefined, isConnected: true };
    expect(renderMarkup(<AaveDashboard />)).not.toContain(POSITIONS_STUB);

    state.account = { address: CONNECTED_ADDRESS, isConnected: false };
    expect(renderMarkup(<AaveDashboard />)).not.toContain(POSITIONS_STUB);
  });
});
