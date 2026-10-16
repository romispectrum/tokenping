import { ImageResponse } from "next/og";
import { OgCard, ogImageOptions } from "~~/components/seo/OgCard";
import { getPost } from "~~/content/blog";
import type { Locale } from "~~/i18n/locales";
import { SEO_MESSAGES } from "~~/i18n/messages/seo";
import { formatAlertChannelsIn } from "~~/services/marketing/alertChannels";
import { SITE_NAME } from "~~/utils/seo";

// The social cards of each language, served by the route handlers under app/og.

export const siteOgImageResponse = async (locale: Locale) => {
  const t = SEO_MESSAGES[locale];
  return new ImageResponse(
    <OgCard title={t.siteOgTitle(formatAlertChannelsIn(locale, "conjunction"))} footer={t.siteOgFooter} />,
    await ogImageOptions(),
  );
};

export const postOgImageResponse = async (locale: Locale, slug: string) => {
  const post = getPost(slug, locale);
  const t = SEO_MESSAGES[locale];
  return new ImageResponse(
    <OgCard title={post?.meta.title ?? t.rssTitle ?? `${SITE_NAME} blog`} footer={t.postOgFooter} />,
    await ogImageOptions(),
  );
};
