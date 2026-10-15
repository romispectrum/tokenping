import { ImageResponse } from "next/og";
import { markDataUri } from "~~/components/seo/brandMark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Full-bleed square: iOS applies its own rounded mask and fills transparent corners with black.
const AppleIcon = () =>
  new ImageResponse(
    <img src={markDataUri({ cornerRadius: 0 })} width={size.width} height={size.height} alt="" />,
    size,
  );

export default AppleIcon;
