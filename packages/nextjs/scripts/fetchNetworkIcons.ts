/**
 * Downloads CoinGecko's logo for every network with an Aave or Morpho market into public/network-icons and writes the
 * table the dashboards read, config/networkIcons.generated.ts. Run it from the repo root when a network is added:
 *
 *   yarn next:network-icons
 *
 * One request to CoinGecko's asset platform list (no key) gives every network's logo URL. The logos are served from
 * this site, so a visitor's browser never contacts CoinGecko (see the privacy page). A refresh that would take a logo
 * away from a network that had one stops before writing anything: that points at a broken source, not a lost logo.
 */
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NETWORK_ICONS as PREVIOUS_ICONS } from "~~/config/networkIcons.generated";
import { SUPPORTED_NETWORKS as NETWORKS } from "~~/config/networks";
import { encodeIconImage } from "~~/scripts/iconImage";
import { requestWithRetry } from "~~/scripts/requestWithRetry";
import {
  COINGECKO_PLATFORMS,
  type NetworkIconEntry,
  isCoinGeckoImageUrl,
  renderNetworkIconsModule,
} from "~~/scripts/tokenIconSources";
import { NETWORK_ICON_DIR } from "~~/utils/networkIcons";

// The package script runs from packages/nextjs.
const ICON_DIR = join(process.cwd(), "public", NETWORK_ICON_DIR);
const GENERATED_MODULE = join(process.cwd(), "config", "networkIcons.generated.ts");

type AssetPlatform = { id: string; image?: { large?: string | null } | null };

const main = async () => {
  const platforms = await requestWithRetry(
    "https://api.coingecko.com/api/v3/asset_platforms",
    response => response.json() as Promise<AssetPlatform[]>,
    { goneStatuses: [] },
  );
  const platformsById = new Map((platforms ?? []).map(platform => [platform.id, platform]));

  const entries: NetworkIconEntry[] = [];
  const encoded = new Map<string, Uint8Array>();
  const missing: string[] = [];
  for (const { chain, name } of NETWORKS) {
    const platform = COINGECKO_PLATFORMS[chain.id];
    if (!platform) {
      missing.push(`${name} (chain ${chain.id}): no CoinGecko platform`);
      continue;
    }
    const url = platformsById.get(platform)?.image?.large;
    if (!isCoinGeckoImageUrl(url)) {
      missing.push(`${name} (${platform}): no logo in the asset platform list`);
      continue;
    }
    const result = await encodeIconImage(url);
    if ("problem" in result) {
      missing.push(`${name} (${platform}): ${result.problem} (${url})`);
      continue;
    }
    encoded.set(platform, result.webp);
    entries.push({ chainId: chain.id, name, icon: platform });
  }

  const lost = NETWORKS.filter(
    ({ chain }) => PREVIOUS_ICONS[chain.id] && !entries.some(entry => entry.chainId === chain.id),
  );
  if (lost.length > 0) {
    throw new Error(
      [
        `${lost.length} networks would lose their logo, so nothing was written:`,
        ...lost.map(({ name }) => `  ${name}`),
        "If CoinGecko really dropped these logos, delete their lines from config/networkIcons.generated.ts and run again.",
      ].join("\n"),
    );
  }

  await mkdir(ICON_DIR, { recursive: true });
  for (const [icon, webp] of encoded) await writeFile(join(ICON_DIR, `${icon}.webp`), webp);
  // Drop logos no network uses any more. Dotfiles (a Finder .DS_Store) are not ours to delete.
  for (const file of await readdir(ICON_DIR)) {
    if (!file.startsWith(".") && !encoded.has(file.replace(/\.webp$/, ""))) await rm(join(ICON_DIR, file));
  }
  await writeFile(GENERATED_MODULE, renderNetworkIconsModule(entries));

  console.log(`${entries.length} networks mapped to logos in public/${NETWORK_ICON_DIR}.`);
  if (missing.length > 0) {
    console.log(`No CoinGecko logo for ${missing.length} networks (the dashboard shows their first letter):`);
    for (const line of missing) console.log(`  ${line}`);
  }
};

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
