// Interim Tokenping mark: a bell with two ping rings on the site's purple-to-indigo gradient. This is the single source
// for public/logo.svg, app/icon.svg, the PNG icons and the social cards (brandMark.test.ts keeps the files in sync).
const GRADIENT_FROM = "#a855f7";
const GRADIENT_TO = "#4f46e5";

type MarkSvgOptions = {
  /** Corner radius of the background square in the 64-unit grid; 0 for icons the OS masks itself (apple-icon). */
  cornerRadius?: number;
};

export const markSvg = ({ cornerRadius = 14 }: MarkSvgOptions = {}) =>
  [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
    '<defs><linearGradient id="tp-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">',
    `<stop offset="0" stop-color="${GRADIENT_FROM}"/><stop offset="1" stop-color="${GRADIENT_TO}"/>`,
    "</linearGradient></defs>",
    `<rect width="64" height="64" rx="${cornerRadius}" fill="url(#tp-bg)"/>`,
    '<g fill="#fff">',
    '<circle cx="30" cy="14.5" r="2.5"/>',
    '<path d="M30 16C22.8 16 18 21.6 18 28.6V36L14 42V44H46V42L42 36V28.6C42 21.6 37.2 16 30 16Z"/>',
    '<path d="M25.5 47A4.5 4.5 0 0 0 34.5 47Z"/>',
    "</g>",
    '<g fill="none" stroke="#fff" stroke-linecap="round" stroke-width="3">',
    '<path d="M43.2 16.1A7 7 0 0 1 48.9 24.2" opacity=".9"/>',
    '<path d="M44.3 10.2A13 13 0 0 1 54.8 25.3" opacity=".6"/>',
    "</g>",
    "</svg>",
  ].join("");

/** For `<img src>` inside next/og ImageResponse, which renders SVG only through an image. */
export const markDataUri = (options?: MarkSvgOptions) =>
  `data:image/svg+xml;base64,${Buffer.from(markSvg(options)).toString("base64")}`;
