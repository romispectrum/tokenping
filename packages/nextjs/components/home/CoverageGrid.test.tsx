// @vitest-environment jsdom
import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CoverageGrid, getCoverageTiles } from "~~/components/home/CoverageGrid";
import { AAVE_CHAINS } from "~~/config/aaveConfig";
import { NETWORK_ICONS } from "~~/config/networkIcons.generated";
import { SUPPORTED_NETWORKS } from "~~/config/networks";
import { HOME_MESSAGES } from "~~/i18n/messages/home";

const NETWORK_NAMES = SUPPORTED_NETWORKS.map(({ name }) => name);

const detailOf = (tiles: ReturnType<typeof getCoverageTiles>, name: string) =>
  tiles.find(tile => tile.name === name)?.detail;

describe("getCoverageTiles", () => {
  it("lists every network once, Aave's in AAVE_CHAINS order, then Morpho's others, with its chain id", () => {
    const tiles = getCoverageTiles(HOME_MESSAGES.en.coverage);

    expect(tiles).toHaveLength(29);
    expect(tiles.map(({ name }) => name)).toEqual(NETWORK_NAMES);
    expect(tiles.slice(0, 22).map(({ chainId }) => chainId)).toEqual(AAVE_CHAINS.map(({ chain }) => chain.id));
    expect(tiles.slice(22).map(({ name }) => name)).toEqual([
      "Unichain",
      "World Chain",
      "HyperEVM",
      "Katana",
      "Robinhood Chain",
      "Stable",
      "Tempo",
    ]);
  });

  it("says what is read on each network: V3 markets, V4 Spokes, Morpho, or several", () => {
    const tiles = getCoverageTiles(HOME_MESSAGES.en.coverage);

    expect(detailOf(tiles, "Ethereum")).toBe("4 V3 markets · 13 V4 Spokes · Morpho");
    expect(detailOf(tiles, "Polygon")).toBe("1 V3 market · Morpho");
    expect(detailOf(tiles, "Avalanche")).toBe("1 V3 market · 3 V4 Spokes");
    expect(detailOf(tiles, "Base")).toBe("1 V3 market · 1 V4 Spoke · Morpho");
    expect(detailOf(tiles, "Arc")).toBe("3 V4 Spokes · Morpho");
    expect(detailOf(tiles, "Gnosis")).toBe("1 V3 market");
    expect(detailOf(tiles, "Tempo")).toBe("Morpho");
    tiles.forEach(tile => expect(tile.detail, tile.name).not.toBe(""));
  });

  it("takes the Czech labels, with Czech plurals", () => {
    const tiles = getCoverageTiles(HOME_MESSAGES.cs.coverage);

    expect(detailOf(tiles, "Ethereum")).toBe("4 trhy V3 · 13 trhů V4 (Spoke) · Morpho");
    expect(detailOf(tiles, "Polygon")).toBe("1 trh V3 · Morpho");
    expect(detailOf(tiles, "Base")).toBe("1 trh V3 · 1 trh V4 (Spoke) · Morpho");
    expect(detailOf(tiles, "Arc")).toBe("3 trhy V4 (Spoke) · Morpho");
  });
});

describe("CoverageGrid", () => {
  it("renders one tile per network with its logo, its name and what is read there", () => {
    const { container } = render(<CoverageGrid labels={HOME_MESSAGES.en.coverage} />);
    const tiles = [...container.querySelectorAll("ul > li")];

    expect(tiles).toHaveLength(29);
    tiles.forEach((tile, index) => {
      const { chain, name } = SUPPORTED_NETWORKS[index];
      const logo = tile.querySelector("img");

      // A network without a logo yet (yarn next:network-icons) shows its initial on the same hidden disc.
      if (NETWORK_ICONS[chain.id]) {
        expect(logo?.getAttribute("src"), name).toBe(`/network-icons/${NETWORK_ICONS[chain.id]}.webp`);
        // The logo is named for crawlers but hidden from assistive technology, so the written name is read once.
        expect(logo?.getAttribute("alt")).toBe(name);
        expect(logo?.closest("[aria-hidden='true']")).not.toBeNull();
      } else {
        expect(logo, name).toBeNull();
      }
      expect(within(tile as HTMLElement).queryByRole("img")).toBeNull();
      expect(within(tile as HTMLElement).getByText(name)).toBeTruthy();
    });
    expect(within(tiles[0] as HTMLElement).getByText("4 V3 markets · 13 V4 Spokes · Morpho")).toBeTruthy();
    expect(within(tiles[21] as HTMLElement).getByText("3 V4 Spokes · Morpho")).toBeTruthy();
  });

  it("is a plain list that takes a class for its placement", () => {
    const { container } = render(<CoverageGrid labels={HOME_MESSAGES.en.coverage} className="mt-6" />);
    const list = container.firstElementChild!;

    expect(list.tagName).toBe("UL");
    expect(list.className).toContain("list-none");
    expect(list.className).toContain("mt-6");
  });
});
