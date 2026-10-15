/* eslint-disable @next/next/no-img-element -- next/og renders plain <img>; next/image does not exist there */
import { markDataUri } from "~~/components/seo/brandMark";
import { SITE_NAME, SITE_URL } from "~~/utils/seo";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

type OgCardProps = {
  title: string;
  /** Bottom-left line, e.g. "Tokenping · Aave V3 guides". */
  footer: string;
};

// Satori (next/og) supports a flexbox subset only: every element with more than one child needs display: flex.
const titleFontSize = (title: string) => (title.length <= 40 ? 76 : title.length <= 60 ? 66 : 56);

/** The 1200x630 social card shared by the site card and the per-post cards. */
export const OgCard = ({ title, footer }: OgCardProps) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "64px 72px",
      color: "#ffffff",
      backgroundImage: "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #581c87 100%)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <img src={markDataUri()} width={88} height={88} alt="" />
      <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>{SITE_NAME}</div>
    </div>
    <div style={{ display: "flex", fontSize: titleFontSize(title), fontWeight: 700, lineHeight: 1.15, maxWidth: 1040 }}>
      {title}
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, color: "#c7d2fe" }}>
      <div style={{ display: "flex" }}>{footer}</div>
      <div style={{ display: "flex" }}>{new URL(SITE_URL).host}</div>
    </div>
  </div>
);
