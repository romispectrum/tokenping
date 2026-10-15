/**
 * The Tokenping mark as data: a tilted bell with two ping arcs, plus the "Tokenping" wordmark outlined from
 * Satoshi Medium. One node tree feeds both renderers, TokenpingLogo (React) and the SVG strings for the favicon,
 * the PNG routes and the social cards (components/seo/brandMark.ts), so the artwork cannot drift between them.
 *
 * Two arts:
 * - solid: one colour (currentColor). The white details are cut out with a mask, so the background shows through.
 * - outline: for dark surfaces. A white silhouette around black shapes with white details; never recoloured.
 *
 * The geometry lives on a 64-unit grid. View boxes are cropped to the ink, so a 100px wide box shows a 100px logo.
 */

export type LogoVariant = "primary" | "symbol";
export type LogoArt = "solid" | "outline";

export type SvgNode = {
  tag: "g" | "path" | "circle" | "rect" | "mask";
  attrs: Record<string, string | number>;
  children?: SvgNode[];
};

/** Solid art follows currentColor; this is its colour when nothing sets one (logo artwork, not a UI colour). */
// lint-brand-ignore-next-line hex-colour: logo artwork fill for SVG attributes, not a UI colour
export const SOLID_DEFAULT_COLOR = "#000";

// lint-brand-ignore-next-line hex-colour: the mark's white and black artwork, written into SVG attributes
const WHITE = "#fff";
const BLACK = "#000"; // lint-brand-ignore hex-colour: logo artwork, see above

/** The bell swings 10 degrees to the left around this pivot; the arcs stay upright. */
const TILT = "rotate(-10 28 36)";
const RIM = { x: 7.5, y: 45, width: 41, height: 7, rx: 2.75 };
const GAP_WIDTH = 3.2;
const OUTLINE_WIDTH = 3;
const ARC_WIDTH = 5.75;
const ARCS = ["M42.24 15.51A10.5 10.5 0 0 1 49.49 25.87", "M45.18 6.48A20 20 0 0 1 58.99 26.2"];

const bellShapes = (): SvgNode[] => [
  {
    tag: "path",
    attrs: {
      d: "M28 13C36 13 40 19 40 26.5V32C40 37.5 42.5 40.5 45.5 42.2C47 43 46.6 45 45 45H11C9.4 45 9 43 10.5 42.2C13.5 40.5 16 37.5 16 32V26.5C16 19 20 13 28 13Z",
    },
  },
  { tag: "circle", attrs: { cx: 28, cy: 11.2, r: 3.6 } },
  { tag: "rect", attrs: { ...RIM } },
  { tag: "circle", attrs: { cx: 28, cy: 55.5, r: 6 } },
];

/**
 * The white details: the glint on the dome and the gaps either side of the rim. Inside the mask the gap lines may
 * overshoot the rim; on the outline art they stop at its ends, or they would poke out of the rounded silhouette.
 */
const details = (stroke: string, overhang: number): SvgNode[] => [
  {
    tag: "path",
    attrs: {
      d: "M21.4 33.5C21.4 26.5 22.8 21.8 26 19.6",
      fill: "none",
      stroke,
      "stroke-width": 3.4,
      "stroke-linecap": "round",
    },
  },
  ...[RIM.y, RIM.y + RIM.height].map(
    (y): SvgNode => ({
      tag: "path",
      attrs: { d: `M${RIM.x - overhang} ${y}H${RIM.x + RIM.width + overhang}`, stroke, "stroke-width": GAP_WIDTH },
    }),
  ),
];

const arcs = (stroke: string, width: number): SvgNode => ({
  tag: "g",
  attrs: { fill: "none", stroke, "stroke-width": width, "stroke-linecap": "round" },
  children: ARCS.map(d => ({ tag: "path", attrs: { d } })),
});

const solidSymbol = (maskId: string): SvgNode[] => [
  {
    tag: "mask",
    attrs: { id: maskId, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 64, height: 64 },
    children: [
      { tag: "rect", attrs: { x: 0, y: 0, width: 64, height: 64, fill: WHITE } },
      { tag: "g", attrs: { transform: TILT }, children: details(BLACK, 2) },
    ],
  },
  {
    tag: "g",
    attrs: { fill: "currentColor", mask: `url(#${maskId})` },
    children: [{ tag: "g", attrs: { transform: TILT }, children: bellShapes() }],
  },
  arcs("currentColor", ARC_WIDTH),
];

const outlineSymbol = (): SvgNode[] => [
  {
    tag: "g",
    attrs: {
      transform: TILT,
      fill: WHITE,
      stroke: WHITE,
      "stroke-width": 2 * OUTLINE_WIDTH,
      "stroke-linejoin": "round",
    },
    children: bellShapes(),
  },
  arcs(WHITE, ARC_WIDTH + 2 * OUTLINE_WIDTH),
  { tag: "g", attrs: { transform: TILT, fill: BLACK }, children: bellShapes() },
  { tag: "g", attrs: { transform: TILT }, children: details(WHITE, 0) },
  arcs(BLACK, ARC_WIDTH),
];

/** "Tokenping" in Satoshi Medium, outlined (font units, y up), placed so its cap height is 0.44 of the symbol. */
const WORDMARK_PATH =
  "M14 -633L232 -633L232 0L330 0L330 -633L547 -633L547 -723L14 -723ZM519 -245C519 -94 627 12 774 12C920 12 1028 -94 1028 -245C1028 -396 920 -502 774 -502C627 -502 519 -396 519 -245ZM614 -245C614 -347 679 -418 774 -418C868 -418 934 -347 934 -245C934 -143 868 -72 774 -72C679 -72 614 -143 614 -245ZM1228 0L1228 -139L1311 -226L1454 0L1562 0L1376 -294L1563 -489L1445 -489L1228 -259L1228 -736L1134 -736L1134 0ZM1832 12C1953 12 2035 -47 2059 -152L1971 -152C1955 -96 1907 -66 1834 -66C1741 -66 1687 -123 1680 -226L2058 -227L2058 -262C2058 -407 1967 -503 1828 -503C1686 -503 1589 -397 1589 -244C1589 -92 1688 12 1832 12ZM1828 -424C1911 -424 1964 -370 1964 -289L1682 -289C1694 -375 1746 -424 1828 -424ZM2257 0L2257 -259C2257 -354 2308 -417 2396 -417C2468 -417 2514 -377 2514 -278L2514 0L2608 0L2608 -299C2608 -424 2549 -503 2420 -503C2351 -503 2289 -470 2258 -414L2248 -489L2163 -489L2163 0ZM2738 219L2832 219L2832 -80C2864 -20 2929 13 3007 13C3152 13 3234 -99 3234 -248C3234 -398 3147 -503 3007 -503C2929 -503 2863 -468 2830 -401L2823 -489L2738 -489ZM2833 -244C2833 -346 2891 -417 2987 -417C3083 -417 3140 -345 3140 -244C3140 -144 3083 -72 2987 -72C2891 -72 2833 -144 2833 -244ZM3384 -605C3418 -605 3446 -633 3446 -667C3446 -702 3418 -729 3384 -729C3350 -729 3322 -702 3322 -667C3322 -633 3350 -605 3384 -605ZM3338 0L3432 0L3432 -489L3338 -489ZM3662 0L3662 -259C3662 -354 3713 -417 3801 -417C3873 -417 3919 -377 3919 -278L3919 0L4013 0L4013 -299C4013 -424 3954 -503 3825 -503C3756 -503 3694 -470 3663 -414L3653 -489L3568 -489L3568 0ZM4112 -257C4112 -120 4200 -13 4339 -13C4416 -13 4480 -47 4512 -104L4512 -6C4512 87 4452 147 4360 147C4278 147 4224 105 4212 33L4118 33C4136 157 4227 232 4360 232C4510 232 4605 134 4605 -20L4605 -489L4521 -489L4514 -406C4483 -467 4422 -503 4343 -503C4201 -503 4112 -395 4112 -257ZM4206 -259C4206 -349 4262 -421 4356 -421C4452 -421 4508 -353 4508 -259C4508 -163 4450 -95 4355 -95C4263 -95 4206 -167 4206 -259Z";

const wordmark = (art: LogoArt): SvgNode => ({
  tag: "path",
  attrs: {
    transform: "translate(75.72 45.07) scale(0.03505)",
    d: WORDMARK_PATH,
    fill: art === "solid" ? "currentColor" : WHITE,
  },
});

/** Ink-cropped view boxes. The outline art is larger by the white outline on every side. */
export const LOGO_VIEWBOX: Record<LogoVariant, Record<LogoArt, string>> = {
  primary: { solid: "9.8 3.6 227.33 57.6", outline: "6.8 0.6 230.33 63.6" },
  symbol: { solid: "9.8 3.6 52.1 57.6", outline: "6.8 0.6 58.1 63.6" },
};

/** The drawing for one variant and art. `maskId` must be unique in the document (solid art only uses it). */
export const logoNodes = (variant: LogoVariant, art: LogoArt, maskId: string): SvgNode[] => {
  const symbol = art === "solid" ? solidSymbol(maskId) : outlineSymbol();
  return variant === "primary" ? [...symbol, wordmark(art)] : symbol;
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
