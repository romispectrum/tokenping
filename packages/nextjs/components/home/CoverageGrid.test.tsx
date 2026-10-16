// @vitest-environment jsdom
import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CoverageGrid, getCoverageTiles } from "~~/components/home/CoverageGrid";
import { AAVE_CHAINS } from "~~/config/aaveConfig";
import { NETWORK_ICONS } from "~~/config/networkIcons.generated";
import { HOME_MESSAGES } from "~~/i18n/messages/home";

const NETWORK_NAMES = AAVE_CHAINS.map(({ name }) => name);

const detailOf = (tiles: ReturnType<typeof getCoverageTiles>, name: string) =>
  tiles.find(tile => tile.name === name)?.detail;

describe("getCoverageTiles", () => {
  it("lists every network once, in AAVE_CHAINS order, with its chain id", () => {
    const tiles = getCoverageTiles(HOME_MESSAGES.en.coverage);

    expect(tiles).toHaveLength(22);
    expect(tiles.map(({ name }) => name)).toEqual(NETWORK_NAMES);
    expect(tiles.map(({ chainId }) => chainId)).toEqual(AAVE_CHAINS.map(({ chain }) => chain.id));
  });

  it("says what is read on each network: V3 markets, V4 Spokes, or both", () => {
    const tiles = getCoverageTiles(HOME_MESSAGES.en.coverage);

    expect(detailOf(tiles, "Ethereum")).toBe("4 V3 markets · 13 V4 Spokes");
    expect(detailOf(tiles, "Polygon")).toBe("1 V3 market");
    expect(detailOf(tiles, "Avalanche")).toBe("1 V3 market · 3 V4 Spokes");
    expect(detailOf(tiles, "Base")).toBe("1 V3 market · 1 V4 Spoke");
    expect(detailOf(tiles, "Arc")).toBe("3 V4 Spokes");
    tiles.forEach(tile => expect(tile.detail, tile.name).not.toBe(""));
  });

  it("takes the Czech labels, with Czech plurals", () => {
    const tiles = getCoverageTiles(HOME_MESSAGES.cs.coverage);

    expect(detailOf(tiles, "Ethereum")).toBe("4 trhy V3 · 13 trhů V4 (Spoke)");
    expect(detailOf(tiles, "Polygon")).toBe("1 trh V3");
    expect(detailOf(tiles, "Base")).toBe("1 trh V3 · 1 trh V4 (Spoke)");
    expect(detailOf(tiles, "Arc")).toBe("3 trhy V4 (Spoke)");
  });
});

describe("CoverageGrid", () => {
  it("renders one tile per network with its logo, its name and what is read there", () => {
    const { container } = render(<CoverageGrid labels={HOME_MESSAGES.en.coverage} />);
    const tiles = [...container.querySelectorAll("ul > li")];

    expect(tiles).toHaveLength(22);
    tiles.forEach((tile, index) => {
      const { chain, name } = AAVE_CHAINS[index];
      const logo = tile.querySelector("img");

      expect(logo?.getAttribute("src"), name).toBe(`/network-icons/${NETWORK_ICONS[chain.id]}.webp`);
      expect(logo?.getAttribute("alt")).toBe("");
      expect(logo?.closest("[aria-hidden='true']")).not.toBeNull();
      expect(within(tile as HTMLElement).getByText(name)).toBeTruthy();
    });
    expect(within(tiles[0] as HTMLElement).getByText("4 V3 markets · 13 V4 Spokes")).toBeTruthy();
    expect(within(tiles[21] as HTMLElement).getByText("3 V4 Spokes")).toBeTruthy();
  });

  it("is a plain list that takes a class for its placement", () => {
    const { container } = render(<CoverageGrid labels={HOME_MESSAGES.en.coverage} className="mt-6" />);
    const list = container.firstElementChild!;

    expect(list.tagName).toBe("UL");
    expect(list.className).toContain("list-none");
    expect(list.className).toContain("mt-6");
  });
});
