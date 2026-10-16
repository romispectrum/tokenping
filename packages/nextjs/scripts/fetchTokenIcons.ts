/**
 * Downloads a CoinGecko icon for every Aave V3 reserve into public/token-icons and writes the table the dashboard
 * reads, config/tokenIcons.generated.ts. Run it from the repo root when Aave lists a new asset or a logo changes:
 *
 *   yarn next:token-icons
 *
 * The icons are served from this site, so a visitor's browser never contacts CoinGecko (see the privacy page).
 *
 * Reserves come from each market's Pool.getReservesList(). Icons come from CoinGecko's token list for the chain (one
 * request, no key), then from the per-address API for reserves the list lacks. That API is rate-limited; a free Demo
 * key in COINGECKO_API_KEY (packages/nextjs/.env.local, or the shell) raises the limit. A reserve CoinGecko has no logo
 * for gets no entry, and the dashboard draws its first letter instead.
 */
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { type Address, createPublicClient } from "viem";
import { AAVE_MARKETS, AAVE_POOL_ABI } from "~~/config/aaveConfig";
import { TOKEN_ICONS as PREVIOUS_ICONS } from "~~/config/tokenIcons.generated";
import { requestWithRetry } from "~~/scripts/requestWithRetry";
import {
  COINGECKO_PLATFORMS,
  type CoinGeckoImage,
  type TokenIconEntry,
  WHITE_BACKED_IMAGES,
  findLostIcons,
  parseCoinGeckoImage,
  renderTokenIconsModule,
} from "~~/scripts/tokenIconSources";
import { readTokenSymbol } from "~~/services/aave/tokenSymbol";
import { getFallbackTransport } from "~~/utils/rpc";
import { TOKEN_ICON_DIR, TOKEN_ICON_SIZE, tokenIconKey } from "~~/utils/tokenIcons";

// The package script runs from packages/nextjs.
const ICON_DIR = join(process.cwd(), "public", TOKEN_ICON_DIR);
const GENERATED_MODULE = join(process.cwd(), "config", "tokenIcons.generated.ts");

const API_KEY = process.env.COINGECKO_API_KEY;
// Demo keys allow 30 calls a minute; without a key CoinGecko allows roughly 5 to 15.
const API_PAUSE_MS = API_KEY ? 2_100 : 6_000;
// The image CDNs answer a deleted object with 403, not 404.
const IMAGE_GONE_STATUSES = [403, 404];
// A refresh that would take icons away from more reserves than this points at a broken source (a blocked CDN, a new URL
// shape, a renamed platform) rather than a few stale logos, so it stops before writing anything.
const MAX_LOST_ICONS = 5;

// The logos are uploaded by token issuers: only the PNG, JPEG and WebP decoders are needed, so the rest stay off.
sharp.block({
  operation: [
    "VipsForeignLoadSvg",
    "VipsForeignLoadHeif",
    "VipsForeignLoadNsgif",
    "VipsForeignLoadTiff",
    "VipsForeignLoadVips",
  ],
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Lowercase address to logo URL, from CoinGecko's token list for one platform. A missing list fails the run: it means
 * the platform id is wrong, not that the chain has no tokens.
 */
const fetchTokenListLogos = async (platform: string) => {
  const logos = new Map<string, string>();
  const list = await requestWithRetry(
    `https://tokens.coingecko.com/${platform}/all.json`,
    response => response.json() as Promise<{ tokens: { address: string; logoURI?: string }[] }>,
    { goneStatuses: [] },
  );
  for (const { address, logoURI } of list?.tokens ?? []) if (logoURI) logos.set(address.toLowerCase(), logoURI);
  return logos;
};

const fetchContractLogo = async (platform: string, address: Address) => {
  await sleep(API_PAUSE_MS);
  const coin = await requestWithRetry(
    `https://api.coingecko.com/api/v3/coins/${platform}/contract/${address.toLowerCase()}`,
    response => response.json() as Promise<{ image?: { large?: string } }>,
    { headers: API_KEY ? { "x-cg-demo-api-key": API_KEY } : {} },
  );
  return coin?.image?.large;
};

type EncodedIcon = { webp: Uint8Array } | { problem: string };

/**
 * Downloads an image and encodes it as a square WebP, transparent unless it is in WHITE_BACKED_IMAGES. Nothing is
 * written here: main writes every icon at once, after its checks pass.
 */
const encodeIcon = async ({ id, largeUrl }: CoinGeckoImage): Promise<EncodedIcon> => {
  const bytes = await requestWithRetry(largeUrl, response => response.arrayBuffer(), {
    goneStatuses: IMAGE_GONE_STATUSES,
  });
  if (!bytes) return { problem: "image gone" };
  try {
    const whiteBacked = WHITE_BACKED_IMAGES.has(id);
    const background = whiteBacked ? { r: 255, g: 255, b: 255, alpha: 1 } : { r: 0, g: 0, b: 0, alpha: 0 };
    const icon = sharp(bytes).resize(TOKEN_ICON_SIZE, TOKEN_ICON_SIZE, { fit: "contain", background });
    if (whiteBacked) icon.flatten({ background });
    return { webp: new Uint8Array(await icon.webp({ quality: 90, effort: 6 }).toBuffer()) };
  } catch (error) {
    return { problem: `image unusable: ${error instanceof Error ? error.message : String(error)}` };
  }
};

const main = async () => {
  console.log(
    API_KEY
      ? "Using the CoinGecko Demo key in COINGECKO_API_KEY."
      : "No COINGECKO_API_KEY: pacing for the keyless limit.",
  );
  const entries: TokenIconEntry[] = [];
  const images = new Map<string, CoinGeckoImage>();
  const reserveKeys = new Set<string>();
  /** Why a reserve has no icon, by tokenIconKey. */
  const missing = new Map<string, string>();

  for (const { chain, pool, name } of AAVE_MARKETS) {
    const platform = COINGECKO_PLATFORMS[chain.id];
    if (!platform) throw new Error(`No CoinGecko platform id for ${name} (chain ${chain.id})`);
    const client = createPublicClient({ chain, transport: getFallbackTransport(chain) });
    const [reserves, listed] = await Promise.all([
      client.readContract({ address: pool, abi: AAVE_POOL_ABI, functionName: "getReservesList" }),
      fetchTokenListLogos(platform),
    ]);
    console.log(`${name}: ${reserves.length} reserves`);

    for (const address of reserves) {
      const key = tokenIconKey(chain.id, address);
      reserveKeys.add(key);
      const symbol = await readTokenSymbol(client, address).catch(() => address);
      const image =
        parseCoinGeckoImage(listed.get(address.toLowerCase())) ??
        parseCoinGeckoImage(await fetchContractLogo(platform, address));
      if (!image) {
        missing.set(key, `${name} ${symbol} ${address}`);
        continue;
      }
      images.set(image.id, image);
      entries.push({ chainId: chain.id, address, symbol, icon: image.id });
    }
  }

  const encoded = new Map<string, Uint8Array>();
  const unusable = new Map<string, string>();
  for (const image of images.values()) {
    const result = await encodeIcon(image);
    if ("webp" in result) encoded.set(image.id, result.webp);
    else unusable.set(image.id, `${result.problem} (${image.largeUrl})`);
  }
  const kept = entries.filter(entry => encoded.has(entry.icon));
  for (const { chainId, address, symbol, icon } of entries) {
    const problem = unusable.get(icon);
    if (problem) missing.set(tokenIconKey(chainId, address), `${symbol} ${address}: ${problem}`);
  }

  const lost = findLostIcons(
    PREVIOUS_ICONS,
    reserveKeys,
    new Set(kept.map(({ chainId, address }) => tokenIconKey(chainId, address))),
  );
  if (lost.length > MAX_LOST_ICONS) {
    throw new Error(
      [
        `${lost.length} reserves would lose their icon, so nothing was written. The first ones:`,
        ...lost.slice(0, 5).map(key => `  ${missing.get(key) ?? key}`),
        "If CoinGecko really dropped these logos, delete their lines from config/tokenIcons.generated.ts and run again.",
      ].join("\n"),
    );
  }

  await mkdir(ICON_DIR, { recursive: true });
  for (const [id, webp] of encoded) await writeFile(join(ICON_DIR, `${id}.webp`), webp);
  // Drop icons no reserve uses any more. Dotfiles (a Finder .DS_Store) are not ours to delete.
  for (const file of await readdir(ICON_DIR)) {
    if (!file.startsWith(".") && !encoded.has(file.replace(/\.webp$/, ""))) await rm(join(ICON_DIR, file));
  }
  const chainNames = new Map(AAVE_MARKETS.map(({ chain, name }) => [chain.id, name]));
  await writeFile(GENERATED_MODULE, renderTokenIconsModule(kept, chainNames));

  console.log(`\n${kept.length} reserves mapped to ${encoded.size} icons in public/${TOKEN_ICON_DIR}.`);
  if (missing.size > 0) {
    console.log(`No CoinGecko logo for ${missing.size} reserves (the dashboard shows their first letter):`);
    for (const line of missing.values()) console.log(`  ${line}`);
  }
};

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
