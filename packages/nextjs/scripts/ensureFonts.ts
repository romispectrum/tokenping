import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { type SatoshiFile, sha256 } from "~~/scripts/satoshiFonts";

// The part of scripts/fetchFonts.ts that decides what to download, kept apart so its rules are testable with a fake
// download.

export type EnsureFontsOptions = {
  files: readonly SatoshiFile[];
  /** packages/nextjs: each file's `dest` is relative to it. */
  root: string;
  /**
   * A folder that outlives a build (node_modules/.cache, which Vercel keeps between deployments) holding verified
   * copies, so a Fontshare outage does not stop a deploy that already built once.
   */
  cacheDir: string;
  /** The whole official zip, as bytes. Called at most once, and only when a file is neither in place nor cached. */
  download: () => Promise<Uint8Array>;
  /** Reads the files named by the suffixes out of the zip: name inside the zip -> bytes. */
  unzip: (zip: Uint8Array, suffixes: readonly string[]) => Record<string, Uint8Array>;
  log?: (message: string) => void;
};

const hashOf = async (path: string) => (existsSync(path) ? sha256(new Uint8Array(await readFile(path))) : null);

const write = async (path: string, data: Uint8Array) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data);
};

/**
 * Makes every file exist at its path with the pinned hash: leaves a verified file alone, copies a verified one from
 * the cache, and downloads the rest. Nothing is written until the downloaded bytes match their hash. Returns the
 * files that had to be put in place.
 */
export const ensureFonts = async ({
  files,
  root,
  cacheDir,
  download,
  unzip,
  log = console.log,
}: EnsureFontsOptions): Promise<SatoshiFile[]> => {
  const absolute = (file: SatoshiFile) => join(root, file.dest);
  const cached = (file: SatoshiFile) => join(cacheDir, basename(file.dest));

  const absent: SatoshiFile[] = [];
  for (const file of files) if ((await hashOf(absolute(file))) !== file.sha256) absent.push(file);
  if (absent.length === 0) return [];

  const toDownload: SatoshiFile[] = [];
  for (const file of absent) {
    if ((await hashOf(cached(file))) === file.sha256) {
      await mkdir(dirname(absolute(file)), { recursive: true });
      await copyFile(cached(file), absolute(file));
      log(`  ${file.dest}: from the build cache`);
    } else {
      toDownload.push(file);
    }
  }
  if (toDownload.length === 0) return absent;

  log(`  downloading Fontshare's Satoshi for ${toDownload.length} file${toDownload.length === 1 ? "" : "s"}`);
  const entries = unzip(
    await download(),
    toDownload.map(file => file.zipSuffix),
  );
  // Verify all before writing any, so a changed release never leaves a half-updated set.
  const verified = toDownload.map(file => {
    const entry = Object.entries(entries).find(([name]) => name.endsWith(`/${file.zipSuffix}`));
    if (!entry)
      throw new Error(`Fontshare's Satoshi zip has no ${file.zipSuffix}. Check ${file.dest} against its page.`);
    const actual = sha256(entry[1]);
    if (actual !== file.sha256) {
      throw new Error(
        `${file.zipSuffix} from Fontshare is not the file the design was built with (sha256 ${actual}, expected ` +
          `${file.sha256}). Satoshi's license forbids editing the file, so do not patch it: read what changed on ` +
          `https://www.fontshare.com/fonts/satoshi, then update scripts/satoshiFonts.ts.`,
      );
    }
    return { file, data: entry[1] };
  });
  for (const { file, data } of verified) {
    await write(absolute(file), data);
    await write(cached(file), data);
    log(`  ${file.dest}: downloaded and verified`);
  }
  return absent;
};
