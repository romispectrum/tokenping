import sharp from "sharp";
import { requestWithRetry } from "~~/scripts/requestWithRetry";
import { TOKEN_ICON_SIZE } from "~~/utils/tokenIcons";

// Shared by scripts/fetchTokenIcons.ts and scripts/fetchNetworkIcons.ts: one way to turn a CoinGecko logo into the
// square WebP the site serves.

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

// The image CDNs answer a deleted object with 403, not 404.
export const IMAGE_GONE_STATUSES = [403, 404];

export type EncodedIcon = { webp: Uint8Array } | { problem: string };

/**
 * Downloads an image and encodes it as a square WebP of TOKEN_ICON_SIZE pixels, transparent unless `whiteBacked`.
 * Nothing is written here: the scripts write every icon at once, after their checks pass.
 */
export const encodeIconImage = async (url: string, whiteBacked = false): Promise<EncodedIcon> => {
  const bytes = await requestWithRetry(url, response => response.arrayBuffer(), { goneStatuses: IMAGE_GONE_STATUSES });
  if (!bytes) return { problem: "image gone" };
  try {
    const background = whiteBacked ? { r: 255, g: 255, b: 255, alpha: 1 } : { r: 0, g: 0, b: 0, alpha: 0 };
    const icon = sharp(bytes).resize(TOKEN_ICON_SIZE, TOKEN_ICON_SIZE, { fit: "contain", background });
    if (whiteBacked) icon.flatten({ background });
    return { webp: new Uint8Array(await icon.webp({ quality: 90, effort: 6 }).toBuffer()) };
  } catch (error) {
    return { problem: `image unusable: ${error instanceof Error ? error.message : String(error)}` };
  }
};
