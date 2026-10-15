/* eslint-disable @next/next/no-img-element -- next/og renders plain <img>; next/image does not exist there */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { LOGO_VIEWBOX } from "~~/components/brand/logoArt";
import { logoSvg, svgDataUri, viewBoxAspect } from "~~/components/seo/brandMark";
import { SITE_NAME, SITE_URL } from "~~/utils/seo";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

// ImageResponse takes no CSS variables, so the token values are written out here: the night background, white
// text, the dark muted text, and the one pink accent bar.
// lint-brand-ignore-next-line hex-colour: ImageResponse cannot read CSS variables
const OG_COLORS = { background: "#18001C", text: "#FFFFFF", muted: "#CBBFC6", accent: "#FE5FA9" } as const;

// The lockup with a white wordmark, for the night surface. Sized by height like everywhere else.
const LOGO_HEIGHT = 64;
const LOGO_WIDTH = Math.round(LOGO_HEIGHT * viewBoxAspect(LOGO_VIEWBOX.primary));
const LOGO_SRC = svgDataUri(logoSvg({ variant: "primary", color: OG_COLORS.text }));

/**
 * Satoshi Medium (titles) and Regular (the footer line) as OTF: ImageResponse cannot read the woff2 web fonts.
 * The routes run in Node, from the package root.
 */
export const ogImageOptions = async () => {
  const [medium, regular] = await Promise.all(
    ["Satoshi-Medium.otf", "Satoshi-Regular.otf"].map(file => readFile(join(process.cwd(), "app/fonts/og", file))),
  );
  return {
    ...OG_IMAGE_SIZE,
    fonts: [
      { name: "Satoshi", data: medium, weight: 500 as const, style: "normal" as const },
      { name: "Satoshi", data: regular, weight: 400 as const, style: "normal" as const },
    ],
  };
};

type OgCardProps = {
  title: string;
  /** The line under the accent bar, e.g. "Tokenping · Aave V3 guides". */
  footer: string;
};

// 72px for short titles, down to 56px so a long title still fits in about two lines inside the 80px safe area.
const titleFontSize = (title: string) => (title.length <= 40 ? 72 : title.length <= 60 ? 64 : 56);

/**
 * The 1200x630 social card shared by the site card and the per-post cards: the lockup on the night colour, the
 * title in Satoshi Medium, one short pink bar as the only accent. Flat: no glow, grain or background gradient.
 * Satori lays out a flexbox subset only, so every element with more than one child sets display: flex.
 */
export const OgCard = ({ title, footer }: OgCardProps) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: 80,
      background: OG_COLORS.background,
      color: OG_COLORS.text,
      // lint-brand-ignore-next-line font-family: the name ImageResponse registers the Satoshi file under
      fontFamily: "Satoshi",
    }}
  >
    <img src={LOGO_SRC} width={LOGO_WIDTH} height={LOGO_HEIGHT} alt={SITE_NAME} />
    <div
      style={{
        display: "flex",
        fontSize: titleFontSize(title),
        fontWeight: 500,
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        maxWidth: 1040,
      }}
    >
      {title}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", width: 160, height: 6, borderRadius: 999, background: OG_COLORS.accent }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 28,
          fontWeight: 400,
          color: OG_COLORS.muted,
        }}
      >
        <div style={{ display: "flex" }}>{footer}</div>
        <div style={{ display: "flex" }}>{new URL(SITE_URL).host}</div>
      </div>
    </div>
  </div>
);
