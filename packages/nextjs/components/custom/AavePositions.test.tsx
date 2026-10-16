// @vitest-environment jsdom
import type { ReactNode } from "react";
import { onlineManager } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AavePositions } from "~~/components/custom/AavePositions";
import {
  ARBITRUM_EMPTY_POSITION,
  BASE_SUMMARY_ONLY_POSITION,
  ETHEREUM_POSITION,
  ETHEREUM_PRIME_POSITION,
  ETHEREUM_V4_LIDO_POSITION,
  ETHEREUM_V4_MAIN_EMPTY_POSITION,
  POLYGON_COLLATERAL_ONLY_POSITION,
} from "~~/components/custom/aave/__fixtures__/positions";
import { LocaleProvider } from "~~/i18n/LocaleProvider";
import { type NetworkPosition, fetchAavePositions } from "~~/services/aave/positions";
import { deferred } from "~~/utils/testing/helpers";
import { renderWithProviders } from "~~/utils/testing/providers";

const USER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const OTHER_USER = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

const account = vi.hoisted(() => ({ address: "", isConnected: true }));
vi.mock("wagmi", () => ({ useAccount: () => ({ ...account }) }));

vi.mock("~~/services/aave/positions", async importOriginal => ({
  ...(await importOriginal<typeof import("~~/services/aave/positions")>()),
  fetchAavePositions: vi.fn(),
}));

// Saved alerts by market key ("1:v3"). hasConfig is one function, stable across renders like the real hook's.
const notifications = vi.hoisted(() => {
  const state = {
    isLoaded: true,
    configuredMarkets: [] as string[],
    hasConfig: ({ chainId, market }: { chainId: number; market: string }) =>
      state.configuredMarkets.includes(`${chainId}:${market}`),
  };
  return state;
});

vi.mock("~~/hooks/custom/useNotificationConfig", () => ({
  useNotificationConfig: () => ({ hasConfig: notifications.hasConfig, isLoaded: notifications.isLoaded }),
}));

vi.mock("~~/components/custom/AccessPaywall", () => ({
  AccessPaywall: ({ children, hasExistingConfig }: { children: ReactNode; hasExistingConfig?: boolean }) => (
    <div data-stub="access-paywall" data-has-existing-config={String(hasExistingConfig)}>
      {children}
    </div>
  ),
}));

// Holds an unsaved draft in local state, like the real form.
vi.mock("~~/components/custom/NotificationConfig", async () => {
  const { useState } = await import("react");
  return {
    NotificationConfig: ({ chainId, market, chainName }: { chainId: number; market: string; chainName: string }) => {
      const [draft, setDraft] = useState("");
      return (
        <input
          aria-label="Notification draft"
          data-stub="notification-config"
          data-chain-id={chainId}
          data-market={market}
          data-chain-name={chainName}
          value={draft}
          onChange={event => setDraft(event.target.value)}
        />
      );
    },
  };
});

const fetchMock = vi.mocked(fetchAavePositions);

const NO_POSITIONS_MESSAGE = "No active Aave positions detected in supported markets.";
const SELECT_PROMPT = "Select a market to view its Aave position.";
const OTHER_MARKETS_HINT = "Markets Tokenping checked where this wallet has no position and no alert.";
// The bell next to a market with a saved alert is decorative; these words carry it for screen readers.
const ALERT_SET = "Alert set";

// One tag per line keeps snapshot diffs readable.
const markup = (container: HTMLElement) => container.innerHTML.replace(/></g, ">\n<");

const networksPanel = () => within(screen.getByRole("region", { name: "Markets" }));
const networkRow = (marketName: string) => networksPanel().getByText(marketName).closest("button")!;
// The folded markets are a native <details> (role group) inside the markets panel; null when every market is active.
const otherMarkets = () => networksPanel().queryByRole("group") as HTMLDetailsElement | null;
const refreshButton = () => screen.getByRole("button", { name: /^(Refresh positions|Refreshing)$/ });
// A loading button keeps its focus and colour: aria-busy, not disabled.
const isRefreshing = () => refreshButton().getAttribute("aria-busy") === "true";

/** Whether the list shows a market open: it has a position, or a saved alert once the alerts are loaded. */
const isActive = (p: NetworkPosition) =>
  p.hasPosition || (notifications.isLoaded && notifications.configuredMarkets.includes(p.key));

/** The markets in list order: the active ones open first, then the folded rest, each side in fetch order. */
const listed = (positions: NetworkPosition[]) => [
  ...positions.filter(isActive),
  ...positions.filter(p => !isActive(p)),
];

// Resolves once the fetch has settled and the default market's details (or the selection prompt) are on screen.
const renderLoaded = async (positions: NetworkPosition[]) => {
  fetchMock.mockResolvedValueOnce(positions);
  const view = renderWithProviders(<AavePositions />);
  const defaultMarket = listed(positions).find(p => p.hasPosition) ?? listed(positions)[0];
  await waitFor(() => {
    expect(isRefreshing()).toBe(false);
    if (defaultMarket) screen.getByRole("heading", { level: 3, name: defaultMarket.marketName });
    else screen.getByText(SELECT_PROMPT);
  });
  return view;
};

describe("AavePositions", () => {
  beforeEach(() => {
    account.address = USER;
    fetchMock.mockReset();
    notifications.isLoaded = true;
    notifications.configuredMarkets = [];
  });

  it("renders skeletons and the refreshing button while loading", () => {
    fetchMock.mockReturnValue(deferred<NetworkPosition[]>().promise);

    const { container } = renderWithProviders(<AavePositions />);

    expect(screen.queryByText(NO_POSITIONS_MESSAGE)).toBeNull();
    expect(isRefreshing()).toBe(true);
    expect(refreshButton().getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByText("Loading positions").getAttribute("aria-live")).toBe("polite");
    expect(markup(container)).toMatchSnapshot();
  });

  it("renders the networks list and the first active network's details once loaded", async () => {
    notifications.configuredMarkets = [ETHEREUM_POSITION.key, ARBITRUM_EMPTY_POSITION.key];

    const { container } = await renderLoaded([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION, BASE_SUMMARY_ONLY_POSITION]);

    expect(fetchMock.mock.calls).toEqual([[USER]]);
    expect(networksPanel().getAllByText(ALERT_SET)).toHaveLength(2);
    expect(container.querySelector('[data-stub="access-paywall"]')?.getAttribute("data-has-existing-config")).toBe(
      "true",
    );
    expect(container.querySelector('[data-stub="notification-config"]')?.getAttribute("data-chain-id")).toBe("1");
    // The dashboard's own controls are never pink: the view's one pink is the paywall's or the alert form's.
    expect(container.querySelectorAll(".btn-primary")).toHaveLength(0);
    expect(markup(container)).toMatchSnapshot();
  });

  it("shows the connected wallet as a copyable checksummed address", async () => {
    await renderLoaded([ETHEREUM_POSITION]);

    expect(screen.getByRole("button", { name: `Copy wallet ${USER}` })).toBeDefined();
    expect(screen.getByTitle(USER).textContent).toContain("0xd8dA...6045");
  });

  it("hides notification bells and does not treat a saved config as existing until configs are loaded", async () => {
    notifications.configuredMarkets = [ETHEREUM_POSITION.key];
    notifications.isLoaded = false;

    const { container } = await renderLoaded([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION]);

    expect(networksPanel().queryAllByText(ALERT_SET)).toHaveLength(0);
    expect(container.querySelector('[data-stub="access-paywall"]')?.getAttribute("data-has-existing-config")).toBe(
      "false",
    );
  });

  it("shows the network the user selects", async () => {
    await renderLoaded([ETHEREUM_POSITION, POLYGON_COLLATERAL_ONLY_POSITION]);

    fireEvent.click(networkRow("Polygon"));

    expect(screen.getByRole("heading", { level: 3, name: "Polygon" })).toBeDefined();
    expect(networkRow("Polygon").getAttribute("aria-current")).toBe("true");
    expect(networkRow("Ethereum").hasAttribute("aria-current")).toBe(false);
  });

  it("starts the notification form afresh when another network is selected", async () => {
    // B0.3
    await renderLoaded([ETHEREUM_POSITION, POLYGON_COLLATERAL_ONLY_POSITION]);
    fireEvent.change(screen.getByLabelText("Notification draft"), { target: { value: "Ethereum draft" } });

    fireEvent.click(networkRow("Polygon"));

    const form = screen.getByLabelText<HTMLInputElement>("Notification draft");
    expect(form.getAttribute("data-chain-id")).toBe("137");
    expect(form.value).toBe("");
  });

  it("shows the next account's default network, not the previous account's pick", async () => {
    // F12: both accounts list the same markets, so the previous pick used to stay selected.
    const view = await renderLoaded([ETHEREUM_POSITION, POLYGON_COLLATERAL_ONLY_POSITION]);
    fireEvent.click(networkRow("Polygon"));
    expect(screen.getByRole("heading", { level: 3, name: "Polygon" })).toBeDefined();

    fetchMock.mockResolvedValueOnce([ETHEREUM_POSITION, POLYGON_COLLATERAL_ONLY_POSITION]);
    account.address = OTHER_USER;
    view.rerender(<AavePositions />);

    await waitFor(() => expect(isRefreshing()).toBe(false));
    expect(fetchMock).toHaveBeenLastCalledWith(OTHER_USER);
    expect(screen.getByRole("heading", { level: 3, name: "Ethereum" })).toBeDefined();
    expect(networkRow("Ethereum").getAttribute("aria-current")).toBe("true");
    expect(networkRow("Polygon").hasAttribute("aria-current")).toBe(false);
  });

  it("keeps the notification form and its draft when the connection comes back", async () => {
    await renderLoaded([ETHEREUM_POSITION]);
    fireEvent.change(screen.getByLabelText("Notification draft"), { target: { value: "Ethereum draft" } });
    fetchMock.mockReturnValueOnce(deferred<NetworkPosition[]>().promise);

    await act(async () => {
      onlineManager.setOnline(false);
      onlineManager.setOnline(true);
      // react-query refetches after resuming paused mutations, a few microtasks later.
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText<HTMLInputElement>("Notification draft").value).toBe("Ethereum draft");
  });

  it("tells the user when no network has an active position, with every market folded but open", async () => {
    const { container } = await renderLoaded([ARBITRUM_EMPTY_POSITION]);

    expect(screen.getByText(NO_POSITIONS_MESSAGE)).toBeDefined();
    expect(otherMarkets()?.open).toBe(true);
    expect(markup(container)).toMatchSnapshot();
  });

  it("shows the selection prompt when no network was returned", async () => {
    await renderLoaded([]);

    expect(screen.getByText(SELECT_PROMPT)).toBeDefined();
    expect(screen.getByText(NO_POSITIONS_MESSAGE)).toBeDefined();
    expect(otherMarkets()).toBeNull();
    expect(networksPanel().queryAllByRole("listitem")).toHaveLength(0);
  });

  it("renders the error box instead of the empty message on failure", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Failed to fetch Aave positions"));

    const { container } = renderWithProviders(<AavePositions />);

    expect(await screen.findByRole("button", { name: "Try again" })).toBeDefined();
    expect(screen.getByRole("alert").textContent).toContain("Positions did not load");
    expect(screen.queryByText(NO_POSITIONS_MESSAGE)).toBeNull();
    expect(markup(container)).toMatchSnapshot();
  });

  it("shows only the error box, without totals or a network to select, when no network could be read", async () => {
    // F11: the outage used to sit above $0.00 totals and a prompt to select a network that is not listed.
    fetchMock.mockRejectedValueOnce(
      new Error("Could not reach any Aave network. Check your connection and try again."),
    );

    renderWithProviders(<AavePositions />);

    expect(await screen.findByRole("button", { name: "Try again" })).toBeDefined();
    expect(screen.getByText("Could not reach any Aave network. Check your connection and try again.")).toBeDefined();
    expect(screen.queryByText("Total supplied")).toBeNull();
    expect(screen.queryByText("$0.00")).toBeNull();
    expect(screen.queryByRole("region", { name: "Markets" })).toBeNull();
    expect(screen.queryByText(SELECT_PROMPT)).toBeNull();
    expect(isRefreshing()).toBe(false);
  });

  it("keeps the last positions below the error box when a refresh fails", async () => {
    await renderLoaded([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION]);

    fetchMock.mockRejectedValueOnce(new Error("rpc down"));
    fireEvent.click(refreshButton());

    expect(await screen.findByRole("button", { name: "Try again" })).toBeDefined();
    expect(screen.getByRole("alert").textContent).toContain("Refresh failed");
    expect(screen.getByText("rpc down")).toBeDefined();
    expect(screen.getByText("Total supplied")).toBeDefined();
    expect(networkRow("Ethereum")).toBeDefined();
    expect(otherMarkets()?.contains(networkRow("Arbitrum"))).toBe(true);
    expect(screen.getByRole("heading", { level: 3, name: "Ethereum" })).toBeDefined();
  });

  it("fetches again from the Try again button", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Failed to fetch Aave positions"));
    renderWithProviders(<AavePositions />);

    fetchMock.mockResolvedValueOnce([ETHEREUM_POSITION]);
    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("heading", { level: 3, name: "Ethereum" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps the active count but shows skeletons while refreshing", async () => {
    const { container } = await renderLoaded([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION]);

    const refresh = deferred<NetworkPosition[]>();
    fetchMock.mockReturnValueOnce(refresh.promise);
    fireEvent.click(refreshButton());

    await waitFor(() => expect(isRefreshing()).toBe(true));
    expect(refreshButton().getAttribute("aria-disabled")).toBe("true");
    expect(networksPanel().getByText("1 active")).toBeDefined();
    expect(container.querySelector('[data-stub="notification-config"]')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(markup(container)).toMatchSnapshot();

    refresh.resolve([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION]);
    await waitFor(() => expect(isRefreshing()).toBe(false));
    expect(screen.getByRole("heading", { level: 3, name: "Ethereum" })).toBeDefined();
  });
});

describe("AavePositions with Aave V4 Spokes", () => {
  const LIDO = ETHEREUM_V4_LIDO_POSITION.marketName;
  const V4_MAIN = ETHEREUM_V4_MAIN_EMPTY_POSITION.marketName;
  const configStub = () => screen.getByLabelText<HTMLInputElement>("Notification draft");

  beforeEach(() => {
    account.address = USER;
    fetchMock.mockReset();
    notifications.isLoaded = true;
    notifications.configuredMarkets = [];
  });

  it("folds an empty Spoke without an alert among the other markets, like an empty V3 market", async () => {
    await renderLoaded([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION, ETHEREUM_V4_MAIN_EMPTY_POSITION]);

    expect(otherMarkets()?.open).toBe(false);
    expect(
      within(otherMarkets()!)
        .getAllByRole("listitem")
        .map(item => item.textContent),
    ).toEqual([expect.stringContaining("Arbitrum"), expect.stringContaining(V4_MAIN)]);
    expect(otherMarkets()?.contains(networkRow("Ethereum"))).toBe(false);
    expect(networksPanel().getByText("Other markets (2)")).toBeDefined();
    expect(networksPanel().getByText("1 active")).toBeDefined();
  });

  it("lists a Spoke with a position open, beside the same chain's V3 market", async () => {
    await renderLoaded([ETHEREUM_POSITION, ETHEREUM_V4_MAIN_EMPTY_POSITION, ETHEREUM_V4_LIDO_POSITION]);

    expect(otherMarkets()?.contains(networkRow("Ethereum"))).toBe(false);
    expect(otherMarkets()?.contains(networkRow(LIDO))).toBe(false);
    expect(otherMarkets()?.contains(networkRow(V4_MAIN))).toBe(true);
    expect(networksPanel().getByText("Other markets (1)")).toBeDefined();
    expect(networksPanel().getByText("2 active")).toBeDefined();
  });

  it("lists an empty Spoke that has an alert open, with its bell, once the alerts are loaded", async () => {
    notifications.configuredMarkets = [ETHEREUM_V4_MAIN_EMPTY_POSITION.key];
    await renderLoaded([ETHEREUM_POSITION, ETHEREUM_V4_MAIN_EMPTY_POSITION]);

    expect(within(networkRow(V4_MAIN)).getByText(ALERT_SET)).toBeDefined();
    expect(within(networkRow(V4_MAIN)).getByText("No position")).toBeDefined();
    expect(within(networkRow("Ethereum")).queryByText(ALERT_SET)).toBeNull();
    expect(otherMarkets()).toBeNull();
    expect(networksPanel().getByText("1 active")).toBeDefined();
  });

  it("folds an empty Spoke despite its alert before the alerts are loaded", async () => {
    notifications.configuredMarkets = [ETHEREUM_V4_MAIN_EMPTY_POSITION.key];
    notifications.isLoaded = false;
    await renderLoaded([ETHEREUM_POSITION, ETHEREUM_V4_MAIN_EMPTY_POSITION]);

    expect(otherMarkets()?.contains(networkRow(V4_MAIN))).toBe(true);
    expect(networksPanel().queryByText(ALERT_SET)).toBeNull();
  });

  it("lists a second V3 market on one chain by its market name, keyed by its pool", async () => {
    await renderLoaded([ETHEREUM_POSITION, ETHEREUM_PRIME_POSITION, ETHEREUM_V4_LIDO_POSITION]);

    expect(networksPanel().getByText("3 active")).toBeDefined();
    expect(otherMarkets()).toBeNull();

    fireEvent.click(networkRow(ETHEREUM_PRIME_POSITION.marketName));

    expect(screen.getByRole("heading", { level: 3, name: ETHEREUM_PRIME_POSITION.marketName })).toBeDefined();
    expect(screen.getByText("Aave V3 market")).toBeDefined();
    expect(configStub().dataset).toMatchObject({
      chainId: "1",
      market: ETHEREUM_PRIME_POSITION.marketId,
      chainName: ETHEREUM_PRIME_POSITION.marketName,
    });
  });

  it("shows the selected Spoke by its market name, as a V4 Spoke, with no Supply APY column", async () => {
    notifications.configuredMarkets = [ETHEREUM_POSITION.key];
    const { container } = await renderLoaded([ETHEREUM_POSITION, ETHEREUM_V4_LIDO_POSITION]);
    const paywall = () =>
      container.querySelector('[data-stub="access-paywall"]')?.getAttribute("data-has-existing-config");
    expect(paywall()).toBe("true");

    fireEvent.click(networkRow(LIDO));

    const details = within(screen.getByRole("region", { name: "Selected market" }));
    expect(details.getByRole("heading", { level: 3, name: LIDO })).toBeDefined();
    expect(details.getByText("Aave V4 Spoke")).toBeDefined();
    expect(details.queryByText("Aave V3 market")).toBeNull();
    expect(details.getAllByRole("columnheader").map(header => header.textContent)).toEqual([
      "Asset",
      "Supplied",
      "Collateral",
      "Asset",
      "Borrowed",
      "Rate type",
    ]);
    expect(networkRow(LIDO).getAttribute("aria-current")).toBe("true");
    expect(networkRow("Ethereum").hasAttribute("aria-current")).toBe(false);
    // The V3 alert on the same chain is not the Spoke's.
    expect(paywall()).toBe("false");
    expect(configStub().dataset).toMatchObject({
      chainId: "1",
      market: ETHEREUM_V4_LIDO_POSITION.marketId,
      chainName: LIDO,
    });
  });

  it("starts the notification form afresh between two markets on one chain", async () => {
    await renderLoaded([ETHEREUM_POSITION, ETHEREUM_V4_LIDO_POSITION]);
    fireEvent.change(configStub(), { target: { value: "V3 draft" } });

    fireEvent.click(networkRow(LIDO));

    expect(configStub().dataset).toMatchObject({ chainId: "1", market: ETHEREUM_V4_LIDO_POSITION.marketId });
    expect(configStub().value).toBe("");

    fireEvent.click(networkRow("Ethereum"));

    expect(configStub().dataset).toMatchObject({ chainId: "1", market: "v3", chainName: "Ethereum" });
    expect(configStub().value).toBe("");
  });
});

describe("AavePositions folding the markets without a position or an alert", () => {
  const summary = () => networksPanel().getByText(/^Other markets \(\d+\)$/);

  beforeEach(() => {
    account.address = USER;
    fetchMock.mockReset();
    notifications.isLoaded = true;
    notifications.configuredMarkets = [];
  });

  it("shows the active markets open and the rest, in their order, under a summary with their count", async () => {
    await renderLoaded([
      ARBITRUM_EMPTY_POSITION,
      ETHEREUM_POSITION,
      ETHEREUM_V4_MAIN_EMPTY_POSITION,
      POLYGON_COLLATERAL_ONLY_POSITION,
    ]);

    const rows = networksPanel()
      .getAllByRole("listitem")
      .map(item => within(item).getByRole("button").textContent);
    expect(rows).toEqual([
      expect.stringContaining("Ethereum"),
      expect.stringContaining("Polygon"),
      expect.stringContaining("Arbitrum"),
      expect.stringContaining("Ethereum (V4 Main)"),
    ]);
    expect(rows[0]).not.toContain("V4");
    const folded = otherMarkets()!;
    expect(folded.tagName).toBe("DETAILS");
    expect(folded.contains(networkRow("Ethereum"))).toBe(false);
    expect(folded.contains(networkRow("Polygon"))).toBe(false);
    expect(folded.contains(networkRow("Arbitrum"))).toBe(true);
    expect(folded.contains(networkRow("Ethereum (V4 Main)"))).toBe(true);
    expect(summary().tagName).toBe("SUMMARY");
    expect(summary().textContent).toBe("Other markets (2)");
    expect(within(folded).getByText(OTHER_MARKETS_HINT)).toBeDefined();
    expect(screen.queryByText(NO_POSITIONS_MESSAGE)).toBeNull();
  });

  it("keeps the group folded while a market is active", async () => {
    await renderLoaded([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION]);

    expect(otherMarkets()?.open).toBe(false);
    expect(otherMarkets()?.hasAttribute("open")).toBe(false);
  });

  it("opens the group when no market is active, so the list is never blank", async () => {
    await renderLoaded([ARBITRUM_EMPTY_POSITION, ETHEREUM_V4_MAIN_EMPTY_POSITION]);

    expect(otherMarkets()?.open).toBe(true);
    expect(summary().textContent).toBe("Other markets (2)");
    expect(screen.getByText(NO_POSITIONS_MESSAGE)).toBeDefined();
    expect(networksPanel().getByText("0 active")).toBeDefined();
  });

  it("renders no group, and no hint, when every market is active", async () => {
    notifications.configuredMarkets = [ARBITRUM_EMPTY_POSITION.key];
    await renderLoaded([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION]);

    expect(otherMarkets()).toBeNull();
    expect(screen.queryByText(/^Other markets/)).toBeNull();
    expect(screen.queryByText(OTHER_MARKETS_HINT)).toBeNull();
  });

  it("treats a V3 market with only an alert as active, with its bell, once the alerts are loaded", async () => {
    notifications.configuredMarkets = [ARBITRUM_EMPTY_POSITION.key];
    await renderLoaded([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION, POLYGON_COLLATERAL_ONLY_POSITION]);

    expect(otherMarkets()).toBeNull();
    expect(within(networkRow("Arbitrum")).getByText(ALERT_SET)).toBeDefined();
    expect(within(networkRow("Arbitrum")).getByText("No position")).toBeDefined();
    // The count above the list is of positions, not of open rows.
    expect(networksPanel().getByText("2 active")).toBeDefined();
  });

  it("selects an alert-only market over a folded one listed before it", async () => {
    notifications.configuredMarkets = [ETHEREUM_V4_MAIN_EMPTY_POSITION.key];
    fetchMock.mockResolvedValueOnce([ARBITRUM_EMPTY_POSITION, ETHEREUM_V4_MAIN_EMPTY_POSITION]);
    renderWithProviders(<AavePositions />);

    expect(await screen.findByRole("heading", { level: 3, name: "Ethereum (V4 Main)" })).toBeDefined();
    expect(networkRow("Ethereum (V4 Main)").getAttribute("aria-current")).toBe("true");
    expect(networkRow("Arbitrum").hasAttribute("aria-current")).toBe(false);
    expect(otherMarkets()?.contains(networkRow("Arbitrum"))).toBe(true);
  });

  it("lets the user pick a folded market, which stays folded in the list but is shown in the details", async () => {
    await renderLoaded([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION]);
    expect(screen.getByRole("heading", { level: 3, name: "Ethereum" })).toBeDefined();

    fireEvent.click(networkRow("Arbitrum"));

    expect(screen.getByRole("heading", { level: 3, name: "Arbitrum" })).toBeDefined();
    expect(screen.getByText("No active position on Arbitrum")).toBeDefined();
    expect(networkRow("Arbitrum").getAttribute("aria-current")).toBe("true");
    expect(networkRow("Ethereum").hasAttribute("aria-current")).toBe(false);
    expect(otherMarkets()?.contains(networkRow("Arbitrum"))).toBe(true);
    expect(screen.getByLabelText("Notification draft").getAttribute("data-chain-id")).toBe("42161");
  });

  it("moves a market out of the group once its alert is loaded, keeping the selection", async () => {
    notifications.configuredMarkets = [ARBITRUM_EMPTY_POSITION.key];
    notifications.isLoaded = false;
    const view = await renderLoaded([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION]);
    expect(otherMarkets()?.contains(networkRow("Arbitrum"))).toBe(true);

    notifications.isLoaded = true;
    view.rerender(<AavePositions />);

    expect(otherMarkets()).toBeNull();
    expect(within(networkRow("Arbitrum")).getByText(ALERT_SET)).toBeDefined();
    expect(networkRow("Ethereum").getAttribute("aria-current")).toBe("true");
  });

  it("hides the group while positions refresh and folds it again once they are back", async () => {
    await renderLoaded([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION]);
    expect(otherMarkets()).not.toBeNull();

    const refresh = deferred<NetworkPosition[]>();
    fetchMock.mockReturnValueOnce(refresh.promise);
    fireEvent.click(refreshButton());
    await waitFor(() => expect(isRefreshing()).toBe(true));
    expect(otherMarkets()).toBeNull();
    expect(screen.queryByText(OTHER_MARKETS_HINT)).toBeNull();

    refresh.resolve([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION, ETHEREUM_V4_MAIN_EMPTY_POSITION]);
    await waitFor(() => expect(isRefreshing()).toBe(false));
    expect(otherMarkets()?.open).toBe(false);
    expect(summary().textContent).toBe("Other markets (2)");
  });

  it("does not show the group under a failed load", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Failed to fetch Aave positions"));
    renderWithProviders(<AavePositions />);

    expect(await screen.findByRole("button", { name: "Try again" })).toBeDefined();
    expect(screen.queryByRole("group")).toBeNull();
    expect(screen.queryByText(OTHER_MARKETS_HINT)).toBeNull();
  });
});

describe("AavePositions in Czech", () => {
  const renderCzech = () =>
    renderWithProviders(
      <LocaleProvider locale="cs">
        <AavePositions />
      </LocaleProvider>,
    );
  const czechRefreshButton = () => screen.getByRole("button", { name: /^(Obnovit pozice|Obnovování)$/ });

  beforeEach(() => {
    account.address = USER;
    fetchMock.mockReset();
    notifications.isLoaded = true;
    notifications.configuredMarkets = [];
  });

  it("labels the toolbar, the totals, the networks and the selected position in Czech", async () => {
    notifications.configuredMarkets = [ETHEREUM_POSITION.key];
    fetchMock.mockResolvedValueOnce([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION, POLYGON_COLLATERAL_ONLY_POSITION]);
    const { container } = renderCzech();
    await waitFor(() => {
      expect(czechRefreshButton().getAttribute("aria-busy")).not.toBe("true");
      screen.getByRole("heading", { level: 3, name: ETHEREUM_POSITION.chainName });
    });

    expect(screen.getByRole("button", { name: `Zkopírovat adresu ${USER}` })).toBeDefined();
    for (const label of ["Celkem vloženo", "Celkem vypůjčeno", "Dluh", "Trh Aave V3"]) {
      expect(screen.getByText(label)).toBeDefined();
    }
    expect(screen.getAllByText("Čisté jmění")).toHaveLength(2);

    const networks = within(screen.getByRole("region", { name: "Trhy" }));
    expect(networks.getByText("2 aktivní")).toBeDefined();
    expect(networks.getByText("Upozornění nastaveno")).toBeDefined();
    expect(networks.getByText("Bez pozice")).toBeDefined();
    // The amounts keep the app's number format; only the words change.
    expect(networks.getByText("vloženo $12.35K,")).toBeDefined();
    expect(networks.getByText("vypůjčeno $2.50K")).toBeDefined();
    // Arbitrum, with neither a position nor an alert, is the one folded market.
    const folded = networks.getByRole("group");
    expect(within(folded).getByText("Další trhy (1)").tagName).toBe("SUMMARY");
    expect(
      within(folded).getByText("Trhy, které Tokenping zkontroloval a kde tato peněženka nemá pozici ani upozornění."),
    ).toBeDefined();
    expect(folded.contains(networks.getByText("Arbitrum"))).toBe(true);
    expect(folded.contains(networks.getByText("Polygon"))).toBe(false);

    const details = within(screen.getByRole("region", { name: "Vybraný trh" }));
    expect(details.getByRole("heading", { level: 4, name: "Vloženo" })).toBeDefined();
    expect(details.getByRole("heading", { level: 4, name: "Vypůjčeno" })).toBeDefined();
    expect(details.getByText("3 aktiva")).toBeDefined();
    expect(details.getByText("4 aktiva")).toBeDefined();
    expect(details.getAllByRole("columnheader").map(header => header.textContent)).toEqual([
      "Aktivum",
      "Vloženo",
      "APY vkladu",
      "Kolaterál",
      "Aktivum",
      "Vypůjčeno",
      "Typ sazby",
    ]);
    expect(container.textContent).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
    expect(container.textContent).not.toMatch(/Total supplied|Markets|Refresh positions/);
  });

  it("selects a collateral-only network with one asset and no debt", async () => {
    fetchMock.mockResolvedValueOnce([POLYGON_COLLATERAL_ONLY_POSITION]);
    renderCzech();
    await screen.findByRole("heading", { level: 3, name: POLYGON_COLLATERAL_ONLY_POSITION.chainName });

    expect(screen.getByText("1 aktivum")).toBeDefined();
    expect(screen.getByText("0 aktiv")).toBeDefined();
    expect(screen.getByText("Žádný nesplacený dluh")).toBeDefined();
  });

  it("tells the user in Czech when no network has an active position", async () => {
    fetchMock.mockResolvedValueOnce([ARBITRUM_EMPTY_POSITION]);
    renderCzech();
    await screen.findByRole("heading", { level: 3, name: ARBITRUM_EMPTY_POSITION.chainName });

    expect(screen.getByText("Na podporovaných trzích jsme nenašli žádné aktivní pozice na Aave.")).toBeDefined();
    expect(screen.getByText("Na síti Arbitrum nemáte žádnou aktivní pozici")).toBeDefined();
  });

  it("folds an empty Spoke under the Czech summary, and names a selected Spoke", async () => {
    fetchMock.mockResolvedValueOnce([ETHEREUM_POSITION, ETHEREUM_V4_MAIN_EMPTY_POSITION]);
    const view = renderCzech();
    await screen.findByRole("heading", { level: 3, name: ETHEREUM_POSITION.marketName });

    const networks = within(screen.getByRole("region", { name: "Trhy" }));
    expect(networks.getByText("Další trhy (1)")).toBeDefined();
    expect(networks.getByRole("group").contains(networks.getByText(ETHEREUM_V4_MAIN_EMPTY_POSITION.marketName))).toBe(
      true,
    );
    expect(screen.queryByText(/Other markets/)).toBeNull();

    fetchMock.mockResolvedValueOnce([ETHEREUM_POSITION, ETHEREUM_V4_LIDO_POSITION]);
    fireEvent.click(czechRefreshButton());
    await waitFor(() => expect(czechRefreshButton().getAttribute("aria-busy")).not.toBe("true"));
    fireEvent.click(screen.getByText(ETHEREUM_V4_LIDO_POSITION.marketName).closest("button")!);

    const details = within(screen.getByRole("region", { name: "Vybraný trh" }));
    expect(details.getByRole("heading", { level: 3, name: ETHEREUM_V4_LIDO_POSITION.marketName })).toBeDefined();
    expect(details.getByText("Spoke Aave V4")).toBeDefined();
    expect(details.queryByText("APY vkladu")).toBeNull();
    expect(screen.queryByRole("group")).toBeNull();
    expect(screen.queryByText(/^Další trhy/)).toBeNull();
    expect(view.container.textContent).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
  });

  it("counts the folded markets with Czech plurals and opens them when nothing is active", async () => {
    fetchMock.mockResolvedValueOnce([ARBITRUM_EMPTY_POSITION, ETHEREUM_V4_MAIN_EMPTY_POSITION]);
    renderCzech();
    await screen.findByRole("heading", { level: 3, name: ARBITRUM_EMPTY_POSITION.chainName });

    const networks = within(screen.getByRole("region", { name: "Trhy" }));
    expect(networks.getByText("Další trhy (2)").tagName).toBe("SUMMARY");
    expect((networks.getByRole("group") as HTMLDetailsElement).open).toBe(true);
    expect(networks.getByText("0 aktivních")).toBeDefined();
    expect(screen.getByText("Na podporovaných trzích jsme nenašli žádné aktivní pozice na Aave.")).toBeDefined();
  });

  it("explains a failed load in Czech, with the Czech fallback message", async () => {
    fetchMock.mockRejectedValueOnce(new Error(""));
    renderCzech();

    expect(await screen.findByRole("button", { name: "Zkusit znovu" })).toBeDefined();
    expect(screen.getByRole("alert").textContent).toContain("Pozice se nenačetly");
    expect(screen.getByRole("alert").textContent).toContain("Pozice na Aave se nepodařilo načíst");
  });

  it("keeps the last positions below a Czech warning when a refresh fails", async () => {
    fetchMock.mockResolvedValueOnce([ETHEREUM_POSITION]);
    renderCzech();
    await screen.findByRole("heading", { level: 3, name: ETHEREUM_POSITION.chainName });

    fetchMock.mockRejectedValueOnce(new Error("RPC down"));
    fireEvent.click(czechRefreshButton());

    expect(await screen.findByText("Obnovení se nezdařilo")).toBeDefined();
    expect(screen.getByText("Zobrazujeme pozice z posledního úspěšného načtení.")).toBeDefined();
  });
});
