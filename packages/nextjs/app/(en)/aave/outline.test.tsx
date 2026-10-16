// @vitest-environment jsdom
import type { ReactNode } from "react";
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AavePage from "~~/app/(en)/aave/page";
import { ARBITRUM_EMPTY_POSITION, ETHEREUM_POSITION } from "~~/components/custom/aave/__fixtures__/positions";
import { fetchAavePositions } from "~~/services/aave/positions";
import { renderWithProviders } from "~~/utils/testing/providers";

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", isConnected: true }),
}));
vi.mock("~~/services/aave/positions", async importOriginal => ({
  ...(await importOriginal<typeof import("~~/services/aave/positions")>()),
  fetchAavePositions: vi.fn(),
}));
vi.mock("~~/hooks/custom/useNotificationConfig", () => ({
  useNotificationConfig: () => ({ hasConfig: () => false, isLoaded: true }),
}));
// The paywall's own heading is an h3 like the others; the stub keeps this test about the page structure.
vi.mock("~~/components/custom/AccessPaywall", () => ({
  AccessPaywall: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
// With hasConfig false the real card is in its first-use state, whose only h3 is the empty-state title.
vi.mock("~~/components/custom/NotificationConfig", () => ({
  NotificationConfig: ({ chainName }: { chainName: string }) => <h3>No alerts on {chainName} yet</h3>,
}));

describe("/aave heading outline with a connected wallet", () => {
  // The server shell owns the h1 and the dashboard's components use h3s, so the island must supply the h2 between them.
  it("goes h1 → h2 → h3 → h4 with no skipped level", async () => {
    vi.mocked(fetchAavePositions).mockResolvedValueOnce([ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION]);
    renderWithProviders(<AavePage />);
    await waitFor(() => screen.getByRole("heading", { level: 3, name: ETHEREUM_POSITION.chainName }));

    const outline = screen.getAllByRole("heading").map(heading => `${heading.tagName} ${heading.textContent}`);

    expect(outline).toEqual([
      "H1 Aave V3 positions and health factor alerts",
      "H2 Your Aave positions",
      "H3 Networks",
      // the selected network's alert settings, then its position
      `H3 No alerts on ${ETHEREUM_POSITION.chainName} yet`,
      `H3 ${ETHEREUM_POSITION.chainName}`,
      // the token tables inside the selected network's card
      "H4 Supplied",
      "H4 Borrowed",
    ]);
  });
});
