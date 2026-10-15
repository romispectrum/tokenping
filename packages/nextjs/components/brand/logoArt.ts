/**
 * The Tokenping mark as data: a white bell with two ping arcs on a rounded purple to indigo square, plus the
 * "Tokenping" wordmark outlined from Satoshi Medium. One node tree feeds both renderers, TokenpingLogo (React) and the
 * SVG strings for the favicon, the PNG routes and the social cards (components/seo/brandMark.ts), so the artwork
 * cannot drift between them.
 *
 * The mark carries its own background, so it is the same on light and dark surfaces. The wordmark is currentColor:
 * it follows the text colour of wherever it sits.
 *
 * The geometry lives on a 64-unit grid: the square fills it exactly. View boxes are cropped to the ink.
 */

export type LogoVariant = "primary" | "symbol";

export type SvgNode = {
  tag: "g" | "path" | "circle" | "rect" | "defs" | "linearGradient" | "stop";
  attrs: Record<string, string | number>;
  children?: SvgNode[];
};

/** The square's corner radius on the 64-unit grid. The apple icon passes 0: iOS rounds the corners itself. */
export const MARK_CORNER_RADIUS = 14;

// lint-brand-ignore-next-line hex-colour: the mark's own gradient and white artwork, written into SVG attributes
const MARK_GRADIENT = { from: "#a855f7", to: "#4f46e5" };
const WHITE = "#fff"; // lint-brand-ignore hex-colour: logo artwork, see above

const mark = (gradientId: string, cornerRadius: number): SvgNode[] => [
  {
    tag: "defs",
    attrs: {},
    children: [
      {
        tag: "linearGradient",
        attrs: { id: gradientId, x1: 0, y1: 0, x2: 64, y2: 64, gradientUnits: "userSpaceOnUse" },
        children: [
          { tag: "stop", attrs: { offset: 0, "stop-color": MARK_GRADIENT.from } },
          { tag: "stop", attrs: { offset: 1, "stop-color": MARK_GRADIENT.to } },
        ],
      },
    ],
  },
  { tag: "rect", attrs: { width: 64, height: 64, rx: cornerRadius, fill: `url(#${gradientId})` } },
  {
    tag: "g",
    attrs: { fill: WHITE },
    children: [
      { tag: "circle", attrs: { cx: 30, cy: 14.5, r: 2.5 } },
      {
        tag: "path",
        attrs: { d: "M30 16C22.8 16 18 21.6 18 28.6V36L14 42V44H46V42L42 36V28.6C42 21.6 37.2 16 30 16Z" },
      },
      { tag: "path", attrs: { d: "M25.5 47A4.5 4.5 0 0 0 34.5 47Z" } },
    ],
  },
  {
    tag: "g",
    attrs: { fill: "none", stroke: WHITE, "stroke-linecap": "round", "stroke-width": 3 },
    children: [
      { tag: "path", attrs: { d: "M43.2 16.1A7 7 0 0 1 48.9 24.2", opacity: 0.9 } },
      { tag: "path", attrs: { d: "M44.3 10.2A13 13 0 0 1 54.8 25.3", opacity: 0.6 } },
    ],
  },
];

/**
 * "Tokenping" in Satoshi Medium, outlined (font units, y up). Its cap height is 0.4 of the square and centred on it,
 * 14 units to the right of the square.
 */
const WORDMARK_PATH =
  "M14 -633L232 -633L232 0L330 0L330 -633L547 -633L547 -723L14 -723ZM519 -245C519 -94 627 12 774 12C920 12 1028 -94 1028 -245C1028 -396 920 -502 774 -502C627 -502 519 -396 519 -245ZM614 -245C614 -347 679 -418 774 -418C868 -418 934 -347 934 -245C934 -143 868 -72 774 -72C679 -72 614 -143 614 -245ZM1228 0L1228 -139L1311 -226L1454 0L1562 0L1376 -294L1563 -489L1445 -489L1228 -259L1228 -736L1134 -736L1134 0ZM1832 12C1953 12 2035 -47 2059 -152L1971 -152C1955 -96 1907 -66 1834 -66C1741 -66 1687 -123 1680 -226L2058 -227L2058 -262C2058 -407 1967 -503 1828 -503C1686 -503 1589 -397 1589 -244C1589 -92 1688 12 1832 12ZM1828 -424C1911 -424 1964 -370 1964 -289L1682 -289C1694 -375 1746 -424 1828 -424ZM2257 0L2257 -259C2257 -354 2308 -417 2396 -417C2468 -417 2514 -377 2514 -278L2514 0L2608 0L2608 -299C2608 -424 2549 -503 2420 -503C2351 -503 2289 -470 2258 -414L2248 -489L2163 -489L2163 0ZM2738 219L2832 219L2832 -80C2864 -20 2929 13 3007 13C3152 13 3234 -99 3234 -248C3234 -398 3147 -503 3007 -503C2929 -503 2863 -468 2830 -401L2823 -489L2738 -489ZM2833 -244C2833 -346 2891 -417 2987 -417C3083 -417 3140 -345 3140 -244C3140 -144 3083 -72 2987 -72C2891 -72 2833 -144 2833 -244ZM3384 -605C3418 -605 3446 -633 3446 -667C3446 -702 3418 -729 3384 -729C3350 -729 3322 -702 3322 -667C3322 -633 3350 -605 3384 -605ZM3338 0L3432 0L3432 -489L3338 -489ZM3662 0L3662 -259C3662 -354 3713 -417 3801 -417C3873 -417 3919 -377 3919 -278L3919 0L4013 0L4013 -299C4013 -424 3954 -503 3825 -503C3756 -503 3694 -470 3663 -414L3653 -489L3568 -489L3568 0ZM4112 -257C4112 -120 4200 -13 4339 -13C4416 -13 4480 -47 4512 -104L4512 -6C4512 87 4452 147 4360 147C4278 147 4224 105 4212 33L4118 33C4136 157 4227 232 4360 232C4510 232 4605 134 4605 -20L4605 -489L4521 -489L4514 -406C4483 -467 4422 -503 4343 -503C4201 -503 4112 -395 4112 -257ZM4206 -259C4206 -349 4262 -421 4356 -421C4452 -421 4508 -353 4508 -259C4508 -163 4450 -95 4355 -95C4263 -95 4206 -167 4206 -259Z";

const wordmark: SvgNode = {
  tag: "path",
  attrs: { transform: "translate(77.5 45) scale(0.036)", d: WORDMARK_PATH, fill: "currentColor" },
};

/** Ink-cropped view boxes: the lockup ends at the right edge of the "g". */
export const LOGO_VIEWBOX: Record<LogoVariant, string> = {
  primary: "0 0 243.3 64",
  symbol: "0 0 64 64",
};

/** The drawing for one variant. `gradientId` must be unique in the document. */
export const logoNodes = (variant: LogoVariant, gradientId: string, cornerRadius = MARK_CORNER_RADIUS): SvgNode[] => {
  const symbol = mark(gradientId, cornerRadius);
  return variant === "primary" ? [...symbol, wordmark] : symbol;
};

/** Serialises nodes to SVG markup. Every value is internal artwork data, so nothing needs escaping. */
export const nodesToSvg = (nodes: SvgNode[]): string =>
  nodes
    .map(({ tag, attrs, children }) => {
      const attributes = Object.entries(attrs)
        .map(([name, value]) => ` ${name}="${value}"`)
        .join("");
      return children ? `<${tag}${attributes}>${nodesToSvg(children)}</${tag}>` : `<${tag}${attributes}/>`;
    })
    .join("");
