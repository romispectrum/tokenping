import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AavePositions } from "~~/components/custom/AavePositions";
import {
  ARBITRUM_EMPTY_POSITION,
  BASE_SUMMARY_ONLY_POSITION,
  ETHEREUM_POSITION,
} from "~~/components/custom/aave/__fixtures__/positions";
import type { NetworkPosition } from "~~/services/aave/positions";
import { renderMarkup } from "~~/utils/testing/render";

const state = vi.hoisted(() => ({
  isClient: true,
  // useSelectedChainId has its own tests; here it just returns the selection under test.
  selectedChainId: null as number | null,
  selectionArgs: [] as unknown[][],
  positions: [] as NetworkPosition[],
  isLoading: false,
  error: null as string | null,
  totals: { totalNetWorthUSD: "0.00", totalCollateralUSD: "0.00", totalDebtUSD: "0.00" },
  configsLoaded: true,
  configuredChainIds: [] as number[],
}));

vi.mock("usehooks-ts", () => ({ useIsClient: () => state.isClient }));

vi.mock("~~/components/custom/aave/useSelectedChainId", () => ({
  useSelectedChainId: (...args: unknown[]) => {
    state.selectionArgs.push(args);
    return [state.selectedChainId, () => undefined];
  },
}));

vi.mock("~~/hooks/custom/useAavePositions", () => ({
  useAavePositions: () => ({
    positions: state.positions,
    isLoading: state.isLoading,
    error: state.error,
    ...state.totals,
    refetch: () => undefined,
  }),
}));

vi.mock("~~/hooks/custom/useNotificationConfig", () => ({
  useNotificationConfig: () => ({
    hasConfig: (chainId: number) => state.configuredChainIds.includes(chainId),
    isLoaded: state.configsLoaded,
  }),
}));

vi.mock("~~/components/custom/AccessPaywall", () => ({
  AccessPaywall: ({ children, hasExistingConfig }: { children: ReactNode; hasExistingConfig?: boolean }) => (
    <div data-stub="access-paywall" data-has-existing-config={String(hasExistingConfig)}>
      {children}
    </div>
  ),
}));

vi.mock("~~/components/custom/NotificationConfig", () => ({
  NotificationConfig: (props: { chainId: number }) => (
    <div data-stub="notification-config" data-chain-id={props.chainId} />
  ),
}));

const LOADED_TOTALS = { totalNetWorthUSD: "10885.42", totalCollateralUSD: "13145.67", totalDebtUSD: "3260.25" };
const NO_POSITIONS_MESSAGE = "No active Aave positions detected on supported networks.";
const BELL_PATH = 'd="M15 17h5l-1.405-1.405';

describe("AavePositions", () => {
  beforeEach(() => {
    state.isClient = true;
    state.selectedChainId = null;
    state.selectionArgs = [];
    state.positions = [];
    state.isLoading = false;
    state.error = null;
    state.totals = { totalNetWorthUSD: "0.00", totalCollateralUSD: "0.00", totalDebtUSD: "0.00" };
    state.configsLoaded = true;
    state.configuredChainIds = [];
  });

  it("renders nothing before mounting on the client", () => {
    state.isClient = false;

    expect(renderMarkup(<AavePositions />)).toBe("");
  });

  it("passes the fetched positions to the selection hook on every render, mounted or not", () => {
    state.positions = [ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION];

    for (const isClient of [false, true]) {
      state.isClient = isClient;
      state.selectionArgs = [];

      renderMarkup(<AavePositions />);

      expect(state.selectionArgs).toHaveLength(1);
      expect(state.selectionArgs[0]).toHaveLength(1);
      expect(state.selectionArgs[0][0]).toBe(state.positions);
    }
  });

  it("renders skeletons and the refreshing button while loading", () => {
    state.isLoading = true;

    expect(renderMarkup(<AavePositions />)).toMatchSnapshot();
  });

  it("renders the networks list and the selection prompt once loaded", () => {
    state.positions = [ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION, BASE_SUMMARY_ONLY_POSITION];
    state.totals = LOADED_TOTALS;
    state.configuredChainIds = [ETHEREUM_POSITION.chainId, ARBITRUM_EMPTY_POSITION.chainId];

    const html = renderMarkup(<AavePositions />);

    expect(html.split(BELL_PATH)).toHaveLength(3);
    expect(html).toMatchSnapshot();
  });

  it("hides notification bells until configs are loaded", () => {
    state.positions = [ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION];
    state.configuredChainIds = [ETHEREUM_POSITION.chainId];
    state.configsLoaded = false;

    expect(renderMarkup(<AavePositions />)).not.toContain(BELL_PATH);
  });

  it("renders the selected network's details", () => {
    state.positions = [ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION, BASE_SUMMARY_ONLY_POSITION];
    state.totals = LOADED_TOTALS;
    state.configuredChainIds = [ETHEREUM_POSITION.chainId];
    state.selectedChainId = ETHEREUM_POSITION.chainId;

    const html = renderMarkup(<AavePositions />);

    expect(html).toContain('data-has-existing-config="true"');
    expect(html).toMatchSnapshot();
  });

  it("does not treat a saved config as existing until configs are loaded", () => {
    state.positions = [ETHEREUM_POSITION];
    state.configuredChainIds = [ETHEREUM_POSITION.chainId];
    state.configsLoaded = false;
    state.selectedChainId = ETHEREUM_POSITION.chainId;

    expect(renderMarkup(<AavePositions />)).toContain('data-has-existing-config="false"');
  });

  it("shows the selection prompt when the selected network is not in the list", () => {
    state.positions = [ARBITRUM_EMPTY_POSITION];
    state.selectedChainId = ETHEREUM_POSITION.chainId;

    expect(renderMarkup(<AavePositions />)).toContain("Select a network on the left to view its Aave position.");
  });

  it("tells the user when no network has an active position", () => {
    state.positions = [ARBITRUM_EMPTY_POSITION];

    const html = renderMarkup(<AavePositions />);

    expect(html).toContain(NO_POSITIONS_MESSAGE);
    expect(html).toMatchSnapshot();
  });

  it("renders the error box instead of the empty message on failure", () => {
    state.error = "Failed to fetch Aave positions";

    const html = renderMarkup(<AavePositions />);

    expect(html).not.toContain(NO_POSITIONS_MESSAGE);
    expect(html).toMatchSnapshot();
  });

  it("keeps the active count but shows skeletons while refreshing", () => {
    state.positions = [ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION];
    state.totals = LOADED_TOTALS;
    state.isLoading = true;
    state.selectedChainId = ETHEREUM_POSITION.chainId;

    const html = renderMarkup(<AavePositions />);

    expect(html).toContain(">1<!-- --> active</p>");
    expect(html).not.toContain('data-stub="notification-config"');
    expect(html).toMatchSnapshot();
  });
});
