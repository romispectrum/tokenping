import { readFileSync, readdirSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { AAVE_MARKETS } from "~~/config/aaveConfig";
import { TOKEN_ICONS } from "~~/config/tokenIcons.generated";
import { WHITE_BACKED_IMAGES } from "~~/scripts/tokenIconSources";
import { TOKEN_ICON_DIR, TOKEN_ICON_SIZE } from "~~/utils/tokenIcons";

// The table and the files are written together by scripts/fetchTokenIcons.ts; these checks keep them in step when
// either is edited by hand or a refresh is committed half way.
const ICON_DIR = new URL(`../public/${TOKEN_ICON_DIR}/`, import.meta.url);
// Dotfiles are not icons: Finder drops a .DS_Store into any folder it opens.
const ICON_FILES = readdirSync(ICON_DIR).filter(file => !file.startsWith("."));
const ICONS = new Set(Object.values(TOKEN_ICONS));
const MARKET_CHAIN_IDS = new Set(AAVE_MARKETS.map(({ chain }) => chain.id));

const readIcon = (icon: string) => sharp(readFileSync(new URL(`${icon}.webp`, ICON_DIR))).metadata();

describe("TOKEN_ICONS", () => {
  it("covers reserves on every Aave market", () => {
    const chainIds = new Set(Object.keys(TOKEN_ICONS).map(key => Number(key.split(":")[0])));

    expect(chainIds).toEqual(MARKET_CHAIN_IDS);
  });

  it("keys each icon by a market chain id and a lowercase address", () => {
    for (const key of Object.keys(TOKEN_ICONS)) {
      expect(key).toMatch(/^\d+:0x[0-9a-f]{40}$/);
      expect(MARKET_CHAIN_IDS.has(Number(key.split(":")[0])), key).toBe(true);
    }
  });

  it("has a file for every icon it names, and no file it does not name", () => {
    expect(new Set(ICON_FILES)).toEqual(new Set([...ICONS].map(icon => `${icon}.webp`)));
  });

  it.each([...ICONS])("stores icon %s as a square WebP at the icon size", async icon => {
    const { format, width, height } = await readIcon(icon);

    expect({ format, width, height }).toEqual({ format: "webp", width: TOKEN_ICON_SIZE, height: TOKEN_ICON_SIZE });
  });

  // Dark artwork on transparency vanishes on the dark theme, so these icons are stored on an opaque white square.
  it.each([...WHITE_BACKED_IMAGES].filter(icon => ICONS.has(icon)))("stores icon %s on a white backing", async icon => {
    const { hasAlpha } = await readIcon(icon);

    expect(hasAlpha).toBe(false);
  });
});
