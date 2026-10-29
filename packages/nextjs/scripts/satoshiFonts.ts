import { createHash } from "node:crypto";

/**
 * Satoshi, the site's typeface, is Indian Type Foundry's. Its license (the ITF FFL, version 2.0 of 17 Aug 2026) lets us
 * self-host it on our own site and draw it into images, and forbids passing the files on: repositories and publicly
 * accessible servers included. Anyone else who wants it must download it from Fontshare themselves. So the files are
 * not in the repository; scripts/fetchFonts.ts downloads Fontshare's official zip and writes them to the paths below,
 * which are gitignored.
 *
 * The license also forbids changing the files (subsetting and format conversion included), so each is checked against
 * the SHA-256 of the file Fontshare served when the design was built. A different hash means Fontshare released a new
 * version: read what changed, then update the hash here.
 */
export const FONTSHARE_DOWNLOAD_URL = "https://api.fontshare.com/v2/fonts/download/satoshi";

export type SatoshiFile = {
  /** The end of the file's path inside Fontshare's zip (the folder at the top has carried the family's name). */
  zipSuffix: string;
  /** Where the app reads it, relative to packages/nextjs. */
  dest: string;
  sha256: string;
};

export const SATOSHI_FILES: readonly SatoshiFile[] = [
  {
    zipSuffix: "Fonts/WEB/fonts/Satoshi-Variable.woff2",
    dest: "app/fonts/Satoshi-Variable.woff2",
    sha256: "e739aff9b4d02c264341d6d4872edcda28e79373aeda936f659566a1cd3eb47f",
  },
  {
    zipSuffix: "Fonts/WEB/fonts/Satoshi-VariableItalic.woff2",
    dest: "app/fonts/Satoshi-VariableItalic.woff2",
    sha256: "e7b4e0ec5fbb156df444371d62c3506fe6256db6ffb55c4982dddbb44e2de351",
  },
  // The social cards: ImageResponse reads OTF, not the web fonts (components/seo/OgCard.tsx).
  {
    zipSuffix: "Fonts/OTF/Satoshi-Medium.otf",
    dest: "app/fonts/og/Satoshi-Medium.otf",
    sha256: "93330866d109f6b2e298748958ec6fa4010cacef586783f281a0b268cab7fc6e",
  },
  {
    zipSuffix: "Fonts/OTF/Satoshi-Regular.otf",
    dest: "app/fonts/og/Satoshi-Regular.otf",
    sha256: "711c6243cdc5431f9cc966e4de18bfb940365bad81acffd1e7948dbe3f254386",
  },
];

export const sha256 = (data: Uint8Array) => createHash("sha256").update(data).digest("hex");
