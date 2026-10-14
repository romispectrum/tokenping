import { beforeEach, describe, expect, it, vi } from "vitest";
import LendingPage from "~~/app/aave/page";
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

describe("Aave page", () => {
  beforeEach(() => {
    state.isClient = true;
    state.account = { address: undefined, isConnected: false };
  });

  it("renders nothing before mounting on the client", () => {
    state.isClient = false;

    expect(renderMarkup(<LendingPage />)).toBe("");
  });

  it("asks a disconnected visitor to connect a wallet", () => {
    const html = renderMarkup(<LendingPage />);

    expect(html).not.toContain(POSITIONS_STUB);
    expect(html).toMatchSnapshot();
  });

  it("renders the positions for a connected wallet", () => {
    state.account = { address: CONNECTED_ADDRESS, isConnected: true };

    expect(renderMarkup(<LendingPage />)).toMatchSnapshot();
  });

  it("requires both a connection and an address", () => {
    state.account = { address: undefined, isConnected: true };
    expect(renderMarkup(<LendingPage />)).not.toContain(POSITIONS_STUB);

    state.account = { address: CONNECTED_ADDRESS, isConnected: false };
    expect(renderMarkup(<LendingPage />)).not.toContain(POSITIONS_STUB);
  });
});
