import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ensureFonts } from "~~/scripts/ensureFonts";
import { SATOSHI_FILES, type SatoshiFile, sha256 } from "~~/scripts/satoshiFonts";

const PACKAGE_ROOT = fileURLToPath(new URL("../", import.meta.url));
const bytes = (text: string) => new TextEncoder().encode(text);

// Two fake fonts with the hashes of their own bytes, so no real font is needed.
const A = bytes("font a");
const B = bytes("font b");
const FILES: SatoshiFile[] = [
  { zipSuffix: "Fonts/WEB/fonts/A.woff2", dest: "app/fonts/A.woff2", sha256: sha256(A) },
  { zipSuffix: "Fonts/OTF/B.otf", dest: "app/fonts/og/B.otf", sha256: sha256(B) },
];
const ZIP: Record<string, Uint8Array> = {
  "Satoshi_Complete/Fonts/WEB/fonts/A.woff2": A,
  "Satoshi_Complete/Fonts/OTF/B.otf": B,
};

let dir: string;
const root = () => join(dir, "app");
const cacheDir = () => join(dir, "cache");
const read = (path: string) => readFileSync(join(root(), path));

const run = (overrides: Partial<Parameters<typeof ensureFonts>[0]> = {}) => {
  const download = vi.fn(async () => bytes("zip"));
  const unzip = vi.fn((_zip: Uint8Array, suffixes: readonly string[]) =>
    Object.fromEntries(Object.entries(ZIP).filter(([name]) => suffixes.some(suffix => name.endsWith(suffix)))),
  );
  const result = ensureFonts({
    files: FILES,
    root: root(),
    cacheDir: cacheDir(),
    download,
    unzip,
    log: () => {},
    ...overrides,
  });
  return { result, download, unzip };
};

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "fonts-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("ensureFonts", () => {
  it("downloads once, writes every verified file and caches it", async () => {
    const { result, download } = run();

    expect(await result).toHaveLength(2);
    expect(download).toHaveBeenCalledTimes(1);
    expect(read("app/fonts/A.woff2")).toEqual(Buffer.from(A));
    expect(read("app/fonts/og/B.otf")).toEqual(Buffer.from(B));
    expect(existsSync(join(cacheDir(), "A.woff2"))).toBe(true);
    expect(existsSync(join(cacheDir(), "B.otf"))).toBe(true);
  });

  it("does nothing, and downloads nothing, when every file is in place", async () => {
    await run().result;
    const { result, download } = run();

    expect(await result).toEqual([]);
    expect(download).not.toHaveBeenCalled();
  });

  it("replaces a file whose hash is wrong", async () => {
    await run().result;
    writeFileSync(join(root(), "app/fonts/A.woff2"), "edited");
    const { result } = run();

    expect(await result).toEqual([FILES[0]]);
    expect(read("app/fonts/A.woff2")).toEqual(Buffer.from(A));
  });

  it("restores a missing file from the cache without a download", async () => {
    await run().result;
    rmSync(join(root(), "app/fonts/og/B.otf"));
    const { result, download } = run();

    expect(await result).toEqual([FILES[1]]);
    expect(download).not.toHaveBeenCalled();
    expect(read("app/fonts/og/B.otf")).toEqual(Buffer.from(B));
  });

  it("ignores a cached file with the wrong hash and downloads instead", async () => {
    mkdirSync(cacheDir(), { recursive: true });
    writeFileSync(join(cacheDir(), "A.woff2"), "corrupt");
    const { result, download } = run();

    await result;
    expect(download).toHaveBeenCalledTimes(1);
    expect(read("app/fonts/A.woff2")).toEqual(Buffer.from(A));
  });

  it("refuses a download that is not the pinned file and writes nothing", async () => {
    const changed = { ...ZIP, "Satoshi_Complete/Fonts/OTF/B.otf": bytes("a new release") };
    const { result } = run({
      unzip: (_zip, suffixes) =>
        Object.fromEntries(Object.entries(changed).filter(([n]) => suffixes.some(s => n.endsWith(s)))),
    });

    await expect(result).rejects.toThrow(/not the file the design was built with[\s\S]*forbids editing/);
    expect(existsSync(join(root(), "app/fonts/A.woff2"))).toBe(false);
    expect(existsSync(join(root(), "app/fonts/og/B.otf"))).toBe(false);
  });

  it("names the file when the zip lacks it", async () => {
    const { result } = run({ unzip: () => ({}) });

    await expect(result).rejects.toThrow(/has no Fonts\/WEB\/fonts\/A\.woff2/);
  });
});

describe("the Satoshi manifest", () => {
  it("lists distinct destinations and well-formed hashes", () => {
    expect(new Set(SATOSHI_FILES.map(file => file.dest)).size).toBe(SATOSHI_FILES.length);
    for (const file of SATOSHI_FILES) expect(file.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes with SHA-256", () => {
    expect(sha256(bytes("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

// Satoshi's license forbids passing the files on, repositories included, so no Satoshi font file may ever be committed.
// A tarball without .git has nothing to check.
describe.skipIf(!existsSync(join(PACKAGE_ROOT, "../../.git")))("the git repository", () => {
  const git = (...args: string[]) => execFileSync("git", args, { cwd: PACKAGE_ROOT, encoding: "utf8" });

  it("tracks no Satoshi font file", () => {
    const tracked = git("ls-files", "--", ":/")
      .split("\n")
      .filter(path => /satoshi[^/]*\.(woff2?|otf|ttf|eot)$/i.test(path));

    expect(tracked).toEqual([]);
  });

  it("ignores every path scripts/satoshiFonts.ts writes", () => {
    for (const file of SATOSHI_FILES) expect(() => git("check-ignore", "-q", file.dest), file.dest).not.toThrow();
  });
});
