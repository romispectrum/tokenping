export const SOCIAL_LINKS = {
  telegram: "https://t.me/tokenping_xyz",
  x: "https://x.com/tokenping",
} as const;

/** The public repository: the app, the payment contract and its deploy scripts. It has no LICENSE file yet. */
export const SOURCE_CODE_URL = "https://github.com/romispectrum/tokenping";

// For every target="_blank" link, so the opened page gets neither window.opener nor the referrer.
export const EXTERNAL_LINK_REL = "noopener noreferrer";
