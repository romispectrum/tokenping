// @vitest-environment jsdom
import type { ReactNode } from "react";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import type { Address, Hex } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MorphoPositions } from "~~/components/custom/morpho/MorphoPositions";
import { getMorphoChain } from "~~/config/morpho";
import { LocaleProvider } from "~~/i18n/LocaleProvider";
import { MorphoApiError, type MorphoPositionRef, fetchMorphoPositions } from "~~/services/morpho/api";
import { NO_DEBT_HEALTH_FACTOR } from "~~/services/morpho/math";
import { type MorphoPosition, morphoRefKey, readMorphoPosition } from "~~/services/morpho/positions";
import type { BlueMarketParams, MidnightMarketParams, MorphoReading } from "~~/services/morpho/types";
import { renderWithProviders } from "~~/utils/testing/providers";

const USER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const account = vi.hoisted(() => ({ address: "", isConnected: true }));
vi.mock("wagmi", () => ({ useAccount: () => ({ ...account }) }));

vi.mock("~~/services/morpho/api", async importOriginal => ({
  ...(await importOriginal<typeof import("~~/services/morpho/api")>()),
  fetchMorphoPositions: vi.fn(),
}));
vi.mock("~~/services/morpho/positions", async importOriginal => ({
  ...(await importOriginal<typeof import("~~/services/morpho/positions")>()),
  readMorphoPosition: vi.fn(),
}));

const notifications = vi.hoisted(() => ({
  isLoaded: true,
  saved: [] as { chainId: number; market: string; protocol?: string }[],
}));
vi.mock("~~/hooks/custom/useNotificationConfig", () => ({
  useNotificationConfig: () => ({
    isLoaded: notifications.isLoaded,
    savedRefs: notifications.saved,
    hasConfig: (ref: { chainId: number; market: string; protocol?: string }) =>
      notifications.saved.some(
        saved => saved.chainId === ref.chainId && saved.market === ref.market && saved.protocol === ref.protocol,
      ),
  }),
}));

vi.mock("~~/components/custom/AccessPaywall", () => ({
  AccessPaywall: ({ description, children }: { description?: string; children?: ReactNode }) => (
    <div data-stub="access-paywall">
      {description}
      {children}
    </div>
  ),
}));
vi.mock("~~/components/custom/NotificationConfig", () => ({
  NotificationConfig: (props: Record<string, unknown>) => (
    <div data-stub="notification-config" data-props={JSON.stringify(props)} />
  ),
}));

const token = (symbol: string, decimals: number) => ({
  address: "0x00000000000000000000000000000000000000b1" as Address,
  symbol,
  decimals,
});
const BLUE_ID = `0x${"7e".repeat(32)}` as Hex;
const MIDNIGHT_ID = `0x${"5c".repeat(32)}` as Hex;
const SAVED_ID = `0x${"4d".repeat(32)}` as Hex;
const BLUE: BlueMarketParams = {
  kind: "blue",
  loanToken: token("USDC", 6),
  collateralToken: token("OETH", 18),
  oracle: "0x00000000000000000000000000000000000000e1",
  irm: "0x00000000000000000000000000000000000000c1",
  lltv: "860000000000000000",
  preLiquidations: [],
};
const MATURITY = 1_793_372_400;
const MIDNIGHT: MidnightMarketParams = {
  kind: "midnight",
  loanToken: token("USDC", 6),
  collaterals: [
    { token: token("savUSD", 18), lltv: "915000000000000000", oracle: "0x00000000000000000000000000000000000000f1" },
  ],
  maturity: MATURITY,
};
const reading = (overrides: Partial<MorphoReading> = {}): MorphoReading => ({
  healthFactor: 1_286_481_888_882_701_105n,
  line: "lltv",
  debt: 55_113_361_618n,
  collateralValue: 82_444_583_206n,
  timestamp: MATURITY - 10 * 86_400,
  ...overrides,
});

const ref = (protocol: MorphoPositionRef["protocol"], chainId: number, marketId: Hex): MorphoPositionRef => ({
  protocol,
  chainId,
  marketId,
  preLiquidations: [],
});
const BLUE_REF = ref("morpho-blue", 8453, BLUE_ID);
const MIDNIGHT_REF = ref("morpho-midnight", 1, MIDNIGHT_ID);

/** Answers each read from `positions` by key: params and reading, or an Error to throw. */
const givenPositions = (
  positions: Record<string, [BlueMarketParams | MidnightMarketParams | null, MorphoReading | null] | Error>,
) =>
  vi.mocked(readMorphoPosition).mockImplementation(async found => {
    const answer = positions[morphoRefKey(found)];
    if (answer instanceof Error) throw answer;
    const [params, value] = answer;
    return {
      key: morphoRefKey(found),
      protocol: found.protocol,
      chain: getMorphoChain(found.chainId)!,
      marketId: found.marketId,
      params,
      reading: value,
    } satisfies MorphoPosition;
  });

const configProps = () =>
  JSON.parse(document.querySelector('[data-stub="notification-config"]')!.getAttribute("data-props")!);
const list = () => within(screen.getByRole("region", { name: "Markets" }));
const row = (pair: string) => list().getByText(pair).closest("button")!;

const renderLoaded = async (ui = <MorphoPositions />) => {
  const view = renderWithProviders(ui);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /Refresh positions/ }).getAttribute("aria-busy")).toBe(null),
  );
  return view;
};

beforeEach(() => {
  account.address = USER;
  notifications.saved = [];
  vi.mocked(fetchMorphoPositions).mockReset().mockResolvedValue([BLUE_REF, MIDNIGHT_REF]);
  vi.mocked(readMorphoPosition).mockReset();
});

describe("MorphoPositions", () => {
  it("lists each found market with its rate and health, and opens the first one's alert and position", async () => {
    givenPositions({
      [morphoRefKey(BLUE_REF)]: [BLUE, reading()],
      [morphoRefKey(MIDNIGHT_REF)]: [MIDNIGHT, reading({ healthFactor: 1_050_000_000_000_000_000n })],
    });
    await renderLoaded();

    expect(row("OETH/USDC").textContent).toContain("Base, Variable rate");
    expect(row("OETH/USDC").textContent).toContain("1.29");
    expect(row("savUSD/USDC").textContent).toContain("Ethereum, Fixed rate, Matures October 30, 2026");
    expect(row("savUSD/USDC").textContent).toContain("1.05");
    expect(list().getByText("2 with debt")).toBeTruthy();
    expect(row("OETH/USDC").getAttribute("aria-current")).toBe("true");

    expect(configProps()).toEqual({
      chainId: 8453,
      market: BLUE_ID,
      protocol: "morpho-blue",
      chainName: "Base (OETH/USDC)",
      chainNameKind: "market",
      currentHealthFactor: "1.29",
    });
    expect(screen.getByText(/Pay once to set health factor alerts on Base \(OETH\/USDC\)/)).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "OETH/USDC" })).toBeTruthy();
    expect(screen.getByText("55,113.3616 USDC")).toBeTruthy();
    expect(screen.getByText("66.84%")).toBeTruthy();
    expect(readMorphoPosition).toHaveBeenCalledWith(BLUE_REF, USER);
  });

  it("shows another market's alert and position when it is picked", async () => {
    givenPositions({
      [morphoRefKey(BLUE_REF)]: [BLUE, reading()],
      [morphoRefKey(MIDNIGHT_REF)]: [MIDNIGHT, reading({ timestamp: MATURITY - 3 * 86_400 - 60 })],
    });
    await renderLoaded();

    fireEvent.click(row("savUSD/USDC"));

    expect(configProps()).toMatchObject({ chainId: 1, market: MIDNIGHT_ID, protocol: "morpho-midnight" });
    expect(screen.getByText(/Oct 30, 2026, 3:00:00 PM Coordinated Universal Time \(in 3 days\)/)).toBeTruthy();
  });

  it("marks a fixed-rate loan past maturity and says it can be liquidated whatever its health factor", async () => {
    vi.mocked(fetchMorphoPositions).mockResolvedValue([MIDNIGHT_REF]);
    givenPositions({ [morphoRefKey(MIDNIGHT_REF)]: [MIDNIGHT, reading({ timestamp: MATURITY + 60 })] });
    await renderLoaded();

    expect(row("savUSD/USDC").textContent).toContain("Past maturity");
    expect(screen.getByText(/This loan is past maturity/)).toBeTruthy();
  });

  it("explains a health factor measured against the borrower's pre-liquidation", async () => {
    vi.mocked(fetchMorphoPositions).mockResolvedValue([BLUE_REF]);
    givenPositions({ [morphoRefKey(BLUE_REF)]: [BLUE, reading({ line: "pre-liquidation" })] });
    await renderLoaded();

    expect(screen.getByText(/You opted into pre-liquidation on this market/)).toBeTruthy();
  });

  it("lists a saved alert's market the API no longer finds, so its alert can still be changed", async () => {
    vi.mocked(fetchMorphoPositions).mockResolvedValue([BLUE_REF]);
    notifications.saved = [
      { chainId: 1, market: "v3" },
      { chainId: 8453, market: SAVED_ID, protocol: "morpho-blue" },
    ];
    const savedRef = ref("morpho-blue", 8453, SAVED_ID);
    givenPositions({
      [morphoRefKey(BLUE_REF)]: [BLUE, reading()],
      [morphoRefKey(savedRef)]: [
        { ...BLUE, collateralToken: token("WETH", 18) },
        reading({ debt: 0n, healthFactor: NO_DEBT_HEALTH_FACTOR }),
      ],
    });
    await renderLoaded();

    expect(readMorphoPosition).toHaveBeenCalledWith(savedRef, USER);
    expect(row("WETH/USDC").textContent).toContain("No debt");
    expect(list().getByText("Alert set")).toBeTruthy();
    fireEvent.click(row("WETH/USDC"));
    expect(screen.getByText("No debt in this market")).toBeTruthy();
  });

  it("still lists the saved alerts' markets when Morpho's API does not answer", async () => {
    vi.mocked(fetchMorphoPositions).mockRejectedValue(new MorphoApiError("down"));
    notifications.saved = [{ chainId: 8453, market: BLUE_ID, protocol: "morpho-blue" }];
    givenPositions({ [morphoRefKey(BLUE_REF)]: [BLUE, reading()] });
    await renderLoaded();

    expect(screen.getByRole("alert").textContent).toContain(
      "Morpho's API did not answer, so only the markets with a saved alert are listed.",
    );
    expect(row("OETH/USDC")).toBeTruthy();
  });

  it("says when nothing is borrowed in a listed market", async () => {
    vi.mocked(fetchMorphoPositions).mockResolvedValue([]);
    await renderLoaded();

    expect(screen.getByText("No borrowing found in the markets the Morpho app lists.")).toBeTruthy();
    expect(document.querySelector('[data-stub="notification-config"]')).toBeNull();
  });

  it("offers to read a position again when its network does not answer", async () => {
    vi.mocked(fetchMorphoPositions).mockResolvedValue([BLUE_REF]);
    givenPositions({ [morphoRefKey(BLUE_REF)]: new Error("rpc down") });
    await renderLoaded();

    expect(row(BLUE_ID.slice(0, 10)).textContent).toContain("Could not be read");
    givenPositions({ [morphoRefKey(BLUE_REF)]: [BLUE, reading()] });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(row("OETH/USDC").textContent).toContain("1.29"));
  });

  it("reads in Czech", async () => {
    vi.mocked(fetchMorphoPositions).mockResolvedValue([BLUE_REF]);
    givenPositions({ [morphoRefKey(BLUE_REF)]: [BLUE, reading()] });
    renderWithProviders(
      <LocaleProvider locale="cs">
        <MorphoPositions />
      </LocaleProvider>,
    );

    await waitFor(() =>
      expect(
        within(screen.getByRole("region", { name: "Trhy" }))
          .getByText("OETH/USDC")
          .closest("button")!.textContent,
      ).toContain("Variabilní sazba"),
    );
    expect(
      screen.getByText(/Zaplaťte jednou a nastavte si upozornění na health factor na trhu Base \(OETH\/USDC\)/),
    ).toBeTruthy();
  });
});
