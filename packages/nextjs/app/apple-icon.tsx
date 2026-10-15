import { ImageResponse } from "next/og";
import { LOGO_VIEWBOX } from "~~/components/brand/logoArt";
import { logoSvg, svgDataUri, viewBoxAspect } from "~~/components/seo/brandMark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS applies its own rounded mask and fills transparent corners with black, so the square is filled with white
// and the black symbol sits in the middle at 70% of the height.
const SYMBOL_HEIGHT = 126;
const SYMBOL_WIDTH = Math.round(SYMBOL_HEIGHT * viewBoxAspect(LOGO_VIEWBOX.symbol.solid));

const AppleIcon = () =>
  new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
        }}
      >
        <img
          src={svgDataUri(logoSvg({ variant: "symbol", art: "solid" }))}
          width={SYMBOL_WIDTH}
          height={SYMBOL_HEIGHT}
          alt=""
        />
      </div>
    ),
    size,
  );

export default AppleIcon;
