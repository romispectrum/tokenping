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
  POLYGON_COLLATERAL_ONLY_POSITION,
} from "~~/components/custom/aave/__fixtures__/positions";
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

const notifications = vi.hoisted(() => ({ isLoaded: true, configuredChainIds: [] as number[] }));

vi.mock("~~/hooks/custom/useNotificationConfig", () => ({
  useNotificationConfig: () => ({
    hasConfig: (chainId: number) => notifications.configuredChainIds.includes(chainId),
    isLoaded: notifications.isLoaded,
  }),
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
    NotificationConfig: ({ chainId }: { chainId: number }) => {
      const [draft, setDraft] = useState("");
      return (
        <input
          aria-label="Notification draft"
          data-stub="notification-config"
          data-chain-id={chainId}
          value={draft}
          onChange={event => setDraft(event.target.value)}
        />
      );
    },
  };
});

const fetchMock = vi.mocked(fetchAavePositions);

const NO_POSITIONS_MESSAGE = "No active Aave positions detected on supported networks.";
const SELECT_PROMPT = "Select a network on the left to view its Aave position.";
const BELL_PATH = 'd="M15 17h5l-1.405-1.405';

// One tag per line keeps snapshot diffs readable.
const markup = (container: HTMLElement) => container.innerHTML.replace(/></g, ">\n<");

const networksPanel = () => within(screen.getByRole("complementary"));
const networkRow = (chainName: string) => networksPanel().getByText(chainName).closest("button")!;
const refreshButton = () => screen.getByRole("button", { name: /^Refresh(ing)? positions$/ });

// Resolves once the fetch has settled and the default network's details (or the selection prompt) are on screen.
const renderLoaded = async (positions: NetworkPosition[]) => {
  fetchMock.mockResolvedValueOnce(positions);
  const view = renderWithProviders(<AavePositions />);
  const defaultNetwork = positions.find(p => p.hasPosition) ?? positions[0];
  await waitFor(() => {
    expect(refreshButton().textContent).toBe("Refresh");
    if (defaultNetwork) screen.getByRole("heading", { level: 3, name: defaultNetwork.chainName });
    else screen.getByText(SELECT_PROMPT);
  });
  return view;
};

describe("AavePositions", () => {
  beforeEach(() => {
    account.address = USER;
    fetchMock.mockReset();
    notifications.isLoaded = true;
    notifications.configuredChainIds = [];
  });

  it("renders skeletons and the refreshing button while loading", () => {
    fetchMock.mockReturnValue(deferred<NetworkPosition[]>().promise);

    const { container } = renderWithProviders(<AavePositions />);

    expect(screen.queryByText(NO_POSITIONS_MESSAGE)).toBeNull();
    expect(refreshButton().getAttribute("aria-label")).toBe("Refreshing positions");
    expect(markup(container)).toMatchSnapshot();
  });

  it("renders the networks list and the first active network's details once loaded", async () => {
    notifications.configuredChainIds = [ETHEREUM_POSITION.chainId, ARBITRUM_EMPTY_POSITION.chainId];

    const { container } = await renderLoaded([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION, BASE_SUMMARY_ONLY_POSITION]);

    expect(fetchMock.mock.calls).toEqual([[USER]]);
    expect(container.innerHTML.split(BELL_PATH)).toHaveLength(3);
    expect(container.querySelector('[data-stub="access-paywall"]')?.getAttribute("data-has-existing-config")).toBe(
      "true",
    );
    expect(container.querySelector('[data-stub="notification-config"]')?.getAttribute("data-chain-id")).toBe("1");
    expect(markup(container)).toMatchSnapshot();
  });

  it("hides notification bells and does not treat a saved config as existing until configs are loaded", async () => {
    notifications.configuredChainIds = [ETHEREUM_POSITION.chainId];
    notifications.isLoaded = false;

    const { container } = await renderLoaded([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION]);

    expect(container.innerHTML).not.toContain(BELL_PATH);
    expect(container.querySelector('[data-stub="access-paywall"]')?.getAttribute("data-has-existing-config")).toBe(
      "false",
    );
  });

  it("shows the network the user selects", async () => {
    await renderLoaded([ETHEREUM_POSITION, POLYGON_COLLATERAL_ONLY_POSITION]);

    fireEvent.click(networkRow("Polygon"));

    expect(screen.getByRole("heading", { level: 3, name: "Polygon" })).toBeDefined();
    expect(networkRow("Polygon").className).toContain("border-primary/40");
    expect(networkRow("Ethereum").className).not.toContain("border-primary/40");
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

    await waitFor(() => expect(refreshButton().textContent).toBe("Refresh"));
    expect(fetchMock).toHaveBeenLastCalledWith(OTHER_USER);
    expect(screen.getByRole("heading", { level: 3, name: "Ethereum" })).toBeDefined();
    expect(networkRow("Ethereum").className).toContain("border-primary/40");
    expect(networkRow("Polygon").className).not.toContain("border-primary/40");
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

  it("tells the user when no network has an active position", async () => {
    const { container } = await renderLoaded([ARBITRUM_EMPTY_POSITION]);

    expect(screen.getByText(NO_POSITIONS_MESSAGE)).toBeDefined();
    expect(markup(container)).toMatchSnapshot();
  });

  it("shows the selection prompt when no network was returned", async () => {
    await renderLoaded([]);

    expect(screen.getByText(SELECT_PROMPT)).toBeDefined();
    expect(screen.getByText(NO_POSITIONS_MESSAGE)).toBeDefined();
  });

  it("renders the error box instead of the empty message on failure", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Failed to fetch Aave positions"));

    const { container } = renderWithProviders(<AavePositions />);

    expect(await screen.findByRole("button", { name: "Try Again" })).toBeDefined();
    expect(screen.queryByText(NO_POSITIONS_MESSAGE)).toBeNull();
    expect(markup(container)).toMatchSnapshot();
  });

  it("shows only the error box, without totals or a network to select, when no network could be read", async () => {
    // F11: the outage used to sit above $0.00 totals and a prompt to select a network that is not listed.
    fetchMock.mockRejectedValueOnce(
      new Error("Could not reach any Aave network. Check your connection and try again."),
    );

    renderWithProviders(<AavePositions />);

    expect(await screen.findByRole("button", { name: "Try Again" })).toBeDefined();
    expect(screen.getByText("Could not reach any Aave network. Check your connection and try again.")).toBeDefined();
    expect(screen.queryByText("Total Supplied")).toBeNull();
    expect(screen.queryByText("$0.00")).toBeNull();
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(screen.queryByText(SELECT_PROMPT)).toBeNull();
    expect(refreshButton().textContent).toBe("Refresh");
  });

  it("keeps the last positions below the error box when a refresh fails", async () => {
    await renderLoaded([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION]);

    fetchMock.mockRejectedValueOnce(new Error("rpc down"));
    fireEvent.click(refreshButton());

    expect(await screen.findByRole("button", { name: "Try Again" })).toBeDefined();
    expect(screen.getByText("rpc down")).toBeDefined();
    expect(screen.getByText("Total Supplied")).toBeDefined();
    expect(networkRow("Arbitrum")).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Ethereum" })).toBeDefined();
  });

  it("fetches again from the Try Again button", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Failed to fetch Aave positions"));
    renderWithProviders(<AavePositions />);

    fetchMock.mockResolvedValueOnce([ETHEREUM_POSITION]);
    fireEvent.click(await screen.findByRole("button", { name: "Try Again" }));

    expect(await screen.findByRole("heading", { level: 3, name: "Ethereum" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Try Again" })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps the active count but shows skeletons while refreshing", async () => {
    const { container } = await renderLoaded([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION]);

    const refresh = deferred<NetworkPosition[]>();
    fetchMock.mockReturnValueOnce(refresh.promise);
    fireEvent.click(refreshButton());

    await waitFor(() => expect(refreshButton().textContent).toBe("Refreshing..."));
    expect((refreshButton() as HTMLButtonElement).disabled).toBe(true);
    expect(networksPanel().getByText("1 active")).toBeDefined();
    expect(container.querySelector('[data-stub="notification-config"]')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(markup(container)).toMatchSnapshot();

    refresh.resolve([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION]);
    await waitFor(() => expect(refreshButton().textContent).toBe("Refresh"));
    expect(screen.getByRole("heading", { level: 3, name: "Ethereum" })).toBeDefined();
  });
});
