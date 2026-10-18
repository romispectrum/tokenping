export const SOCIAL_LINKS = {
  telegram: "https://t.me/tokenping_xyz",
  x: "https://x.com/tokenping",
  /** The Signal community group's invite link. */
  signal: "https://signal.group/#CjQKIMs3x5VYgyCxm2IolF2E4BMuaMQz2T3iEcMpG-q9dSPnEhDFdhbdbCg-W4poA14HJDRS",
} as const;

/** The public repository: the app, the payment contract and its deploy scripts. It has no LICENSE file yet. */
export const SOURCE_CODE_URL = "https://github.com/romispectrum/tokenping";

// For every target="_blank" link, so the opened page gets neither window.opener nor the referrer.
export const EXTERNAL_LINK_REL = "noopener noreferrer";
