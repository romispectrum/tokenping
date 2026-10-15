import {
  LOGO_VIEWBOX,
  type LogoArt,
  type LogoVariant,
  SOLID_DEFAULT_COLOR,
  logoNodes,
  nodesToSvg,
} from "~~/components/brand/logoArt";

// Standalone SVG documents of the Tokenping mark, for files and images that cannot render the TokenpingLogo
// component: app/icon.svg, public/logo.svg (brandMark.test.ts keeps both in sync), the PNG routes and the social
// cards. next/og renders SVG only through an <img>, hence the data URIs.

const SVG_NS = "http://www.w3.org/2000/svg";

type LogoSvgOptions = {
  variant: LogoVariant;
  art: LogoArt;
  /** Colour of the solid art (black by default); the outline art ignores it. */
  color?: string;
};

export const logoSvg = ({ variant, art, color = SOLID_DEFAULT_COLOR }: LogoSvgOptions) =>
  `<svg xmlns="${SVG_NS}" viewBox="${LOGO_VIEWBOX[variant][art]}" color="${color}">${nodesToSvg(
    logoNodes(variant, art, `tp-${variant}-mask`),
  )}</svg>`;

/**
 * The favicon: the solid symbol on light browser chrome, the outline symbol when the browser is in dark mode. Each
 * art sits in its own nested viewport, so both fill the square.
 */
export const faviconSvg = () =>
  [
    `<svg xmlns="${SVG_NS}" viewBox="0 0 64 64">`,
    "<style>.tp-dark{display:none}@media (prefers-color-scheme:dark){.tp-light{display:none}.tp-dark{display:inline}}</style>",
    `<svg class="tp-light" viewBox="${LOGO_VIEWBOX.symbol.solid}" width="64" height="64" color="${SOLID_DEFAULT_COLOR}">`,
    nodesToSvg(logoNodes("symbol", "solid", "tp-favicon-mask")),
    "</svg>",
    `<svg class="tp-dark" viewBox="${LOGO_VIEWBOX.symbol.outline}" width="64" height="64">`,
    nodesToSvg(logoNodes("symbol", "outline", "tp-favicon-outline-mask")),
    "</svg>",
    "</svg>",
  ].join("");

export const svgDataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

/** Width over height of a view box string, for sizing an <img> of the mark by its height. */
export const viewBoxAspect = (viewBox: string) => {
  const [, , width, height] = viewBox.split(" ").map(Number);
  return width / height;
};
