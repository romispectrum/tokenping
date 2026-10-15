import { beforeEach, describe, expect, it, vi } from "vitest";
import { AaveDashboard } from "~~/app/aave/_components/AaveDashboard";
import { renderMarkup } from "~~/utils/testing/render";

const state = vi.hoisted(() => ({
  isClient: true,
  connectModalOpen: false,
  account: {
    address: undefined as string | undefined,
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
  },
}));

vi.mock("usehooks-ts", () => ({ useIsClient: () => state.isClient }));
vi.mock("wagmi", () => ({ useAccount: () => state.account }));
vi.mock("@rainbow-me/rainbowkit", () => ({
  useConnectModal: () => ({ connectModalOpen: state.connectModalOpen, openConnectModal: () => undefined }),
}));
vi.mock("~~/components/custom/AavePositions", () => ({ AavePositions: () => <div data-stub="aave-positions" /> }));

const CONNECTED_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const POSITIONS_STUB = '<div data-stub="aave-positions">';
const SKELETON = '<div aria-busy="true" class="flex flex-col gap-6">';
const GATE_TITLE = ">Connect a wallet to continue</h2>";

describe("AaveDashboard", () => {
  beforeEach(() => {
    state.isClient = true;
    state.connectModalOpen = false;
    state.account = { address: undefined, isConnected: false, isConnecting: false, isReconnecting: false };
  });

  it("renders the dashboard placeholder before mounting on the client, so wallet state cannot cause a hydration mismatch", () => {
    state.isClient = false;
    state.account = { address: CONNECTED_ADDRESS, isConnected: true, isConnecting: false, isReconnecting: false };
    const html = renderMarkup(<AaveDashboard />);

    expect(html.startsWith(SKELETON)).toBe(true);
    expect(html).toContain(">Loading your dashboard</span>");
    expect(html).not.toContain(POSITIONS_STUB);
    expect(html).not.toContain(GATE_TITLE);
  });

  it("keeps the placeholder while a returning wallet reconnects, instead of flashing the connect prompt", () => {
    state.account = { address: undefined, isConnected: false, isConnecting: false, isReconnecting: true };

    expect(renderMarkup(<AaveDashboard />).startsWith(SKELETON)).toBe(true);
  });

  it("asks a disconnected visitor to connect a wallet, with the view's one pink button, under the page's h1", () => {
    const html = renderMarkup(<AaveDashboard />);

    expect(html).not.toContain(POSITIONS_STUB);
    expect(html).not.toContain("<h1");
    expect(html).toContain(GATE_TITLE);
    expect(html).toContain("Connecting does not move funds or cost a fee.");
    expect(html.split("btn-primary").length - 1).toBe(1);
    expect(html).toMatchSnapshot();
  });

  it("shows the connect button as busy while the visitor connects a wallet from the wallet list", () => {
    state.account = { address: undefined, isConnected: false, isConnecting: true, isReconnecting: false };
    state.connectModalOpen = true;
    const html = renderMarkup(<AaveDashboard />);

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Connecting</span>");
    expect(html).toContain(">Approve the connection in your wallet.</div>");
  });

  // On a visit without a saved session wagmi's mount-time check reports "connecting" with no wallet prompt open.
  it("keeps the connect button idle and clickable while wagmi checks for a wallet on its own", () => {
    state.account = { address: undefined, isConnected: false, isConnecting: true, isReconnecting: false };
    const html = renderMarkup(<AaveDashboard />);

    expect(html).toContain(GATE_TITLE);
    expect(html).not.toContain('aria-busy="true"');
    expect(html).not.toContain('aria-disabled="true"');
    expect(html).not.toContain("Connecting</span>");
    expect(html).not.toContain("Approve the connection in your wallet.");
  });

  it("renders the positions for a connected wallet", () => {
    state.account = { address: CONNECTED_ADDRESS, isConnected: true, isConnecting: false, isReconnecting: false };

    expect(renderMarkup(<AaveDashboard />)).toMatchSnapshot();
  });

  // AavePositions, PositionDetails and the notification card use h3s, which would follow the page's h1 directly.
  it("gives a connected wallet's dashboard an h2 above the positions' h3 headings", () => {
    state.account = { address: CONNECTED_ADDRESS, isConnected: true, isConnecting: false, isReconnecting: false };
    const html = renderMarkup(<AaveDashboard />);

    expect(html).toContain('<section aria-labelledby="your-positions" class="w-full">');
    expect(html).toContain('<h2 id="your-positions" class="sr-only">Your Aave positions</h2>');
    expect(html.indexOf("<h2")).toBeLessThan(html.indexOf(POSITIONS_STUB));
  });

  it("requires both a connection and an address", () => {
    state.account = { address: undefined, isConnected: true, isConnecting: false, isReconnecting: false };
    expect(renderMarkup(<AaveDashboard />)).not.toContain(POSITIONS_STUB);

    state.account = { address: CONNECTED_ADDRESS, isConnected: false, isConnecting: false, isReconnecting: false };
    expect(renderMarkup(<AaveDashboard />)).not.toContain(POSITIONS_STUB);
  });
});
