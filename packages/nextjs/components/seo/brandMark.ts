import { LOGO_VIEWBOX, type LogoVariant, MARK_CORNER_RADIUS, logoNodes, nodesToSvg } from "~~/components/brand/logoArt";

// Standalone SVG documents of the Tokenping mark, for files and images that cannot render the TokenpingLogo
// component: app/icon.svg, public/logo.svg (brandMark.test.ts keeps both in sync), the PNG routes and the social
// cards. next/og renders SVG only through an <img>, hence the data URIs.

const SVG_NS = "http://www.w3.org/2000/svg";

type LogoSvgOptions = {
  variant: LogoVariant;
  /** Colour of the wordmark. A standalone file inherits no text colour, so a lockup needs one. */
  color?: string;
  cornerRadius?: number;
};

export const logoSvg = ({ variant, color, cornerRadius = MARK_CORNER_RADIUS }: LogoSvgOptions) =>
  `<svg xmlns="${SVG_NS}" viewBox="${LOGO_VIEWBOX[variant]}"${color ? ` color="${color}"` : ""}>${nodesToSvg(
    logoNodes(variant, `tp-${variant}-gradient`, cornerRadius),
  )}</svg>`;

/** The favicon: the mark alone. Its gradient square reads on light and dark browser chrome alike. */
export const faviconSvg = () => logoSvg({ variant: "symbol" });

export const svgDataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

/** Width over height of a view box string, for sizing an <img> of the mark by its height. */
export const viewBoxAspect = (viewBox: string) => {
  const [, , width, height] = viewBox.split(" ").map(Number);
  return width / height;
};
