export const SOCIAL_LINKS = {
  telegram: "https://t.me/tokenping_xyz",
  x: "https://x.com/tokenping",
  /** The Signal community group's invite link. */
  signal: "https://signal.group/#CjQKIMs3x5VYgyCxm2IolF2E4BMuaMQz2T3iEcMpG-q9dSPnEhDFdhbdbCg-W4poA14HJDRS",
} as const;

/** The public repository: the app, the payment contract and its deploy scripts. It has no LICENSE file yet. */
export const SOURCE_CODE_URL = "https://github.com/romispectrum/tokenping";

/**
 * Where donations go. Checked on Ethereum mainnet on 19 Oct 2026: the ENS name resolves to this address, which is also
 * the address's primary name. Shown as text with a copy button; the page never looks the name up, so visitors' browsers
 * make no RPC call for it.
 */
export const DONATION = {
  ens: "romispectrum.eth",
  address: "0x4f57c97f76E8d1C889eaA74A02E150BE1e0EDe25",
} as const;

// For every target="_blank" link, so the opened page gets neither window.opener nor the referrer.
export const EXTERNAL_LINK_REL = "noopener noreferrer";
