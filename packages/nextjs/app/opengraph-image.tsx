import { ImageResponse } from "next/og";
import { OG_IMAGE_SIZE, OgCard } from "~~/components/seo/OgCard";
import { formatAlertChannels } from "~~/services/marketing/alertChannels";
import { SITE_NAME, SITE_OG_IMAGE } from "~~/utils/seo";

export const alt = SITE_OG_IMAGE.alt;
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

const SiteOpenGraphImage = () =>
  new ImageResponse(
    <OgCard title={`Aave health factor alerts on ${formatAlertChannels("and")}`} footer={`${SITE_NAME} · Aave V3`} />,
    size,
  );

export default SiteOpenGraphImage;
