import { describe, expect, it } from "vitest";
import { PositionDetails } from "~~/components/custom/aave/PositionDetails";
import {
  ARBITRUM_EMPTY_POSITION,
  AVALANCHE_DEBT_ONLY_POSITION,
  BASE_SUMMARY_ONLY_POSITION,
  ETHEREUM_POSITION,
  ETHEREUM_PRIME_POSITION,
  ETHEREUM_V4_LIDO_POSITION,
  ETHEREUM_V4_MAIN_EMPTY_POSITION,
  POLYGON_COLLATERAL_ONLY_POSITION,
  SUPPLIED_USDC,
} from "~~/components/custom/aave/__fixtures__/positions";
import { LocaleProvider } from "~~/i18n/LocaleProvider";
import { renderMarkup } from "~~/utils/testing/render";

describe("PositionDetails", () => {
  it("renders an active position with collateral and debt tables", () => {
    const html = renderMarkup(<PositionDetails position={ETHEREUM_POSITION} />);

    expect(html).toContain('<h3 class="m-0 truncate text-base font-medium text-foreground">Ethereum</h3>');
    expect(html).toContain(">Aave V3 market</p>");
    expect(html).toContain(">Supply APY</th>");
    expect(html).toContain('<h4 id="supplied-1-v3"');
    expect(html).toContain('<h4 id="borrowed-1-v3"');
    expect(html.split("<table").length - 1).toBe(2);
    // The details card is flat product UI: no shadow and no pink of its own (the alert settings own the view's pink).
    expect(html).not.toMatch(/shadow-card|\bbg-primary\b/);
    expect(html).toContain("Token and network icons from");
    // The space before the hidden "(opens in a new tab)" sits outside it, so the link's accessible name keeps it.
    expect(html).toContain('CoinGecko<!-- --> <span class="sr-only">(opens in a new tab)</span>');
    expect(html).toMatchSnapshot();
  });

  it("puts the network's logo, larger than in the list, before the market name in the header", () => {
    const html = renderMarkup(<PositionDetails position={ETHEREUM_POSITION} />);
    const header = html.slice(0, html.indexOf("<h3"));

    expect(header).toMatch(/<span aria-hidden="true" class="[^"]*size-8[^"]*">\s*<img [^>]*alt="Ethereum"/);
    expect(header).toContain('src="/network-icons/ethereum.webp"');
    expect(html.match(/network-icons/g)).toHaveLength(1);
  });

  it("shows the chain's logo for a second V3 market and for a V4 Spoke on that chain", () => {
    for (const position of [ETHEREUM_PRIME_POSITION, ETHEREUM_V4_LIDO_POSITION]) {
      const html = renderMarkup(<PositionDetails position={position} />);

      expect(html, position.marketName).toContain('src="/network-icons/ethereum.webp"');
      expect(html).toContain(`>${position.marketName}</h3>`);
    }
    expect(renderMarkup(<PositionDetails position={ARBITRUM_EMPTY_POSITION} />)).toContain(
      'src="/network-icons/arbitrum-one.webp"',
    );
  });

  it("renders the empty debt list for a collateral-only position", () => {
    const html = renderMarkup(<PositionDetails position={POLYGON_COLLATERAL_ONLY_POSITION} />);

    expect(html).toContain(">No outstanding debt</p>");
    expect(html).toMatchSnapshot();
  });

  it("renders the empty collateral list for a debt-only position", () => {
    const html = renderMarkup(<PositionDetails position={AVALANCHE_DEBT_ONLY_POSITION} />);

    expect(html).toContain(">No collateral supplied</p>");
    expect(html).toMatchSnapshot();
  });

  it("explains missing token details under the summary instead of empty tables", () => {
    const html = renderMarkup(<PositionDetails position={BASE_SUMMARY_ONLY_POSITION} />);

    expect(html).toContain('data-variant="warning"');
    expect(html).toContain(">Token details did not load</div>");
    expect(html).not.toContain("<table");
    expect(html).toMatchSnapshot();
  });

  it("renders the no-position message without stats or a health factor badge", () => {
    const html = renderMarkup(<PositionDetails position={ARBITRUM_EMPTY_POSITION} />);

    expect(html).toContain(">No active position on Arbitrum</p>");
    expect(html).not.toContain("Health factor");
    expect(html).not.toContain("<dl");
    expect(html).toMatchSnapshot();
  });
});

describe("PositionDetails for an Aave V4 Spoke", () => {
  const LIDO_IDS = "1-0xe1900480ac69f0b296841cd01cc37546d92f35cd";

  it("names the Spoke, and leaves the Supply APY column out of the supply table", () => {
    const html = renderMarkup(<PositionDetails position={ETHEREUM_V4_LIDO_POSITION} />);

    expect(html).toContain('<h3 class="m-0 truncate text-base font-medium text-foreground">Ethereum (V4 Lido)</h3>');
    expect(html).toContain(">Aave V4 Spoke</p>");
    expect(html).not.toContain("Aave V3 market");
    expect(html).not.toContain("Supply APY");
    // Three header cells and three cells per supplied row: asset, amount and collateral, with no empty rate cell.
    const supplied = html.slice(
      html.indexOf(`<h4 id="supplied-${LIDO_IDS}"`),
      html.indexOf(`<h4 id="borrowed-${LIDO_IDS}"`),
    );
    expect(supplied).toContain(`<table aria-labelledby="supplied-${LIDO_IDS}"`);
    expect(supplied.match(/<th scope="col"/g)).toHaveLength(3);
    expect(supplied.match(/<td /g)).toHaveLength(2);
    expect(supplied).toContain(">Enabled</td>");
    expect(supplied).not.toContain("%</td>");
    expect(html).toContain(`<table aria-labelledby="borrowed-${LIDO_IDS}"`);
    expect(html).toContain(">Variable 250.5</td>");
  });

  it("keeps the ids of two markets on one chain apart", () => {
    const v3 = renderMarkup(<PositionDetails position={ETHEREUM_POSITION} />);
    const v4 = renderMarkup(<PositionDetails position={ETHEREUM_V4_LIDO_POSITION} />);
    const ids = (html: string) => [...html.matchAll(/ id="([^"]+)"/g)].map(([, id]) => id);

    expect(ids(v4)).toEqual([`supplied-${LIDO_IDS}`, `borrowed-${LIDO_IDS}`]);
    expect(ids(v3).filter(id => ids(v4).includes(id))).toEqual([]);
  });

  it("names an empty Spoke in its no-position message", () => {
    const html = renderMarkup(<PositionDetails position={ETHEREUM_V4_MAIN_EMPTY_POSITION} />);

    expect(html).toContain(">Ethereum (V4 Main)</h3>");
    expect(html).toContain(">Aave V4 Spoke</p>");
    expect(html).toContain(">No active position on Ethereum (V4 Main)</p>");
    expect(html).not.toContain("<table");
  });
});

describe("PositionDetails in Czech", () => {
  const czech = (position: Parameters<typeof PositionDetails>[0]["position"]) =>
    renderMarkup(
      <LocaleProvider locale="cs">
        <PositionDetails position={position} />
      </LocaleProvider>,
    );

  it("labels the totals and tables in Czech and counts assets with Czech plurals", () => {
    const html = czech(ETHEREUM_POSITION);

    expect(html).toContain(">Trh Aave V3</p>");
    expect(html).toContain(">Kolaterál</dt>");
    expect(html).toContain(">Dluh</dt>");
    expect(html).toContain(">Čisté jmění</dt>");
    expect(html).toContain('<h4 id="supplied-1-v3" class="m-0 text-sm font-medium text-foreground">Vloženo</h4>');
    expect(html).toContain('<h4 id="borrowed-1-v3" class="m-0 text-sm font-medium text-foreground">Vypůjčeno</h4>');
    expect(html).toContain(">3 aktiva</p>");
    expect(html).toContain(">4 aktiva</p>");
    expect(html).toContain("Ikony tokenů a sítí z");
    expect(html).not.toContain("Token and network icons");
    expect(html).toContain("(otevře se v nové záložce)");
    expect(html).toContain("Health factor ");
    expect(html).toContain(">Bezpečný</span>");
    expect(html).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
  });

  it.each([
    [1, "1 aktivum"],
    [5, "5 aktiv"],
  ])("counts %i supplied asset(s) as %j", (count, label) => {
    const tokens = Array.from({ length: count }, (_, i) => ({
      ...SUPPLIED_USDC,
      asset: `0x${String(i + 1).padStart(40, "0")}` as const,
    }));
    const html = czech({ ...POLYGON_COLLATERAL_ONLY_POSITION, tokens });

    expect(html).toContain(`>${label}</p>`);
    expect(html).toContain(">0 aktiv</p>");
    expect(html).toContain(">Žádný nesplacený dluh</p>");
  });

  it("calls a V4 Spoke a Spoke in Czech and leaves out the APY column", () => {
    const html = czech(ETHEREUM_V4_LIDO_POSITION);

    expect(html).toContain(">Ethereum (V4 Lido)</h3>");
    expect(html).toContain(">Spoke Aave V4</p>");
    expect(html).not.toContain("Trh Aave V3");
    expect(html).not.toContain("APY vkladu");
    expect(czech(ETHEREUM_POSITION)).toContain(">APY vkladu</th>");
  });

  it("explains an empty network and missing token details in Czech", () => {
    expect(czech(ARBITRUM_EMPTY_POSITION)).toContain(
      ">Aave pro tuto peněženku na síti Arbitrum neuvádí žádný kolaterál ani dluh.</p>",
    );
    expect(czech(AVALANCHE_DEBT_ONLY_POSITION)).toContain(">Žádný vložený kolaterál</p>");
    const summaryOnly = czech(BASE_SUMMARY_ONLY_POSITION);
    expect(summaryOnly).toContain(">Podrobnosti o tokenech se nenačetly</div>");
    expect(summaryOnly).toContain("Součty výše pocházejí ze souhrnu účtu na Aave. Pro nový pokus obnovte pozice.");
  });
});
