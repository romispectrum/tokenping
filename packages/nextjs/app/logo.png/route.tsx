/* eslint-disable @next/next/no-img-element -- next/og renders plain <img>; next/image does not exist there */
import { ImageResponse } from "next/og";
import { markDataUri } from "~~/components/seo/brandMark";

// The 512x512 PNG that the Organization JSON-LD names as its logo (LOGO_PATH in utils/seo).
export const dynamic = "force-static";

const LOGO_SIZE = 512;

export const GET = () =>
  new ImageResponse(<img src={markDataUri()} width={LOGO_SIZE} height={LOGO_SIZE} alt="" />, {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  });
