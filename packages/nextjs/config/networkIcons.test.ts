import { readFileSync, readdirSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { AAVE_CHAINS, AAVE_MARKETS, AAVE_V4_SPOKES } from "~~/config/aaveConfig";
import { NETWORK_ICONS } from "~~/config/networkIcons.generated";
import { COINGECKO_PLATFORMS, renderNetworkIconsModule } from "~~/scripts/tokenIconSources";
import { NETWORK_ICON_DIR, networkIconSrc } from "~~/utils/networkIcons";
import { TOKEN_ICON_SIZE } from "~~/utils/tokenIcons";

// The table and the files are written together by scripts/fetchNetworkIcons.ts; these checks keep them in step with
// each other and with AAVE_CHAINS when any of them is edited by hand or a refresh is committed half way.
const ICON_DIR = new URL(`../public/${NETWORK_ICON_DIR}/`, import.meta.url);
// Dotfiles are not icons: Finder drops a .DS_Store into any folder it opens.
const ICON_FILES = readdirSync(ICON_DIR).filter(file => !file.startsWith("."));
const ICONS = Object.values(NETWORK_ICONS);
const CHAIN_IDS = new Set(AAVE_CHAINS.map(({ chain }) => chain.id));

const readIcon = (icon: string) => sharp(readFileSync(new URL(`${icon}.webp`, ICON_DIR))).metadata();

describe("NETWORK_ICONS", () => {
  it("has a logo for every chain with an Aave market, and for no other", () => {
    expect(new Set(Object.keys(NETWORK_ICONS).map(Number))).toEqual(CHAIN_IDS);
    expect(CHAIN_IDS).toEqual(new Set([...AAVE_MARKETS, ...AAVE_V4_SPOKES].map(({ chain }) => chain.id)));
  });

  it("names each chain's logo by its CoinGecko platform id", () => {
    for (const { chain, name } of AAVE_CHAINS)
      expect(NETWORK_ICONS[chain.id], name).toBe(COINGECKO_PLATFORMS[chain.id]);
    expect(new Set(ICONS).size).toBe(ICONS.length);
  });

  it("is what the script writes for AAVE_CHAINS, so a refresh changes nothing", () => {
    const entries = AAVE_CHAINS.map(({ chain, name }) => ({ chainId: chain.id, name, icon: NETWORK_ICONS[chain.id] }));

    expect(readFileSync(new URL("./networkIcons.generated.ts", import.meta.url), "utf8")).toBe(
      renderNetworkIconsModule(entries),
    );
  });

  it("has a file for every logo it names, and no file it does not name", () => {
    expect(new Set(ICON_FILES)).toEqual(new Set(ICONS.map(icon => `${icon}.webp`)));
  });

  it("serves each logo from the folder the files are in", () => {
    for (const icon of ICONS) {
      expect(networkIconSrc(icon)).toBe(`/${NETWORK_ICON_DIR}/${icon}.webp`);
      expect(ICON_FILES).toContain(networkIconSrc(icon).split("/").at(-1));
    }
  });

  // Network logos go through the same encodeIconImage as token icons, at the token icon size.
  it.each(ICONS)("stores logo %s as a square WebP at the icon size", async icon => {
    const { format, width, height } = await readIcon(icon);

    expect({ format, width, height }).toEqual({ format: "webp", width: TOKEN_ICON_SIZE, height: TOKEN_ICON_SIZE });
  });
});
