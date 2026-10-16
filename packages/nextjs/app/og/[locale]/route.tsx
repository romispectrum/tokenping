import { notFound } from "next/navigation";
import { siteOgImageResponse } from "~~/components/seo/ogImages";
import { LOCALES, isLocale } from "~~/i18n/locales";

// The site's social card in each language, at a fixed URL (/og/en, /og/cs) that utils/seo siteOgImage names. A route
// handler rather than an opengraph-image file: those get a hashed URL inside the (en) and (cs) route groups.
export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = () => LOCALES.map(locale => ({ locale }));

type SiteCardProps = {
  params: Promise<{ locale: string }>;
};

export const GET = async (_request: Request, { params }: SiteCardProps) => {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return siteOgImageResponse(locale);
};
