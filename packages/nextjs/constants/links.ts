export const SOCIAL_LINKS = {
  telegram: "https://t.me/tokenping_xyz",
  x: "https://x.com/tokenping",
} as const;

// For every target="_blank" link, so the opened page gets neither window.opener nor the referrer.
export const EXTERNAL_LINK_REL = "noopener noreferrer";
