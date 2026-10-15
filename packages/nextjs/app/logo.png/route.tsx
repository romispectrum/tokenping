/* eslint-disable @next/next/no-img-element -- next/og renders plain <img>; next/image does not exist there */
import { ImageResponse } from "next/og";
import { LOGO_VIEWBOX } from "~~/components/brand/logoArt";
import { logoSvg, svgDataUri, viewBoxAspect } from "~~/components/seo/brandMark";

// The 512x512 PNG that the Organization JSON-LD names as its logo (LOGO_PATH in utils/seo): the black symbol on
// white, because search engines need a raster logo and show it on light backgrounds.
export const dynamic = "force-static";

const LOGO_SIZE = 512;
const SYMBOL_HEIGHT = 400;
const SYMBOL_WIDTH = Math.round(SYMBOL_HEIGHT * viewBoxAspect(LOGO_VIEWBOX.symbol.solid));

export const GET = () =>
  new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // lint-brand-ignore-next-line hex-colour: ImageResponse cannot read CSS variables
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
    { width: LOGO_SIZE, height: LOGO_SIZE },
  );
