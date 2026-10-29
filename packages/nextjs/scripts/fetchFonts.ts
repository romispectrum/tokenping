/**
 * Puts Satoshi where the app reads it, packages/nextjs/app/fonts. The files are not in the repository (Satoshi's
 * license forbids passing them on, repositories included; see scripts/satoshiFonts.ts), so this downloads Fontshare's
 * official zip, checks every file against its pinned SHA-256 and writes them. Run it from the repo root:
 *
 *   yarn next:fonts           # puts any missing or different file in place
 *   yarn next:fonts --check   # only checks, exits 1 when a file is missing or different
 *
 * `yarn build`, `yarn dev` and `yarn test` run it first, and it does nothing when the files are already right. A
 * verified copy is also kept in node_modules/.cache, so a Fontshare outage does not stop a deployment that built once.
 */
import { unzipSync } from "fflate";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ensureFonts } from "~~/scripts/ensureFonts";
import { requestWithRetry } from "~~/scripts/requestWithRetry";
import { FONTSHARE_DOWNLOAD_URL, SATOSHI_FILES, sha256 } from "~~/scripts/satoshiFonts";

// The package script runs from packages/nextjs.
const ROOT = process.cwd();
const CACHE_DIR = join(ROOT, "node_modules", ".cache", "tokenping-fonts");

const check = async () => {
  const wrong: string[] = [];
  for (const file of SATOSHI_FILES) {
    const path = join(ROOT, file.dest);
    if (!existsSync(path) || sha256(new Uint8Array(await readFile(path))) !== file.sha256) wrong.push(file.dest);
  }
  if (wrong.length > 0) {
    console.error(`Satoshi is missing or changed: ${wrong.join(", ")}. Run yarn next:fonts.`);
    process.exit(1);
  }
  console.log(`Satoshi: ${SATOSHI_FILES.length} files in place and verified`);
};

const main = async () => {
  if (process.argv.includes("--check")) return check();
  const put = await ensureFonts({
    files: SATOSHI_FILES,
    root: ROOT,
    cacheDir: CACHE_DIR,
    unzip: (zip, suffixes) => unzipSync(zip, { filter: entry => suffixes.some(suffix => entry.name.endsWith(suffix)) }),
    download: async () => {
      const zip = await requestWithRetry(
        FONTSHARE_DOWNLOAD_URL,
        async response => new Uint8Array(await response.arrayBuffer()),
        {
          goneStatuses: [],
          timeoutMs: 60_000,
          networkRetryWaitMs: 5_000,
        },
      );
      if (!zip) throw new Error(`${FONTSHARE_DOWNLOAD_URL} returned nothing`);
      return zip;
    },
  });
  console.log(
    put.length === 0
      ? `Satoshi: ${SATOSHI_FILES.length} files in place and verified`
      : `Satoshi: put ${put.length} file${put.length === 1 ? "" : "s"} in place`,
  );
};

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
