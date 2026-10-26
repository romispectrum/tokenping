import type { ReactNode } from "react";
import type { Metadata } from "next";
import { SOCIAL_LINKS, SOURCE_CODE_URL } from "~~/constants/links";
import type { PostMeta } from "~~/content/blog/types";
import { capitalize } from "~~/i18n/format";
import { DEFAULT_LOCALE, LOCALES, LOCALE_INFO, type Locale, type Localized } from "~~/i18n/locales";
import { SEO_MESSAGES } from "~~/i18n/messages/seo";
import { postPath, routePath } from "~~/i18n/routes";
import { formatAlertChannelsIn } from "~~/services/marketing/alertChannels";
import { reactNodeText } from "~~/utils/reactText";

// Canonicals, the sitemap, RSS and JSON-LD always name production, also on previews and local or IPFS builds.
// `||` rather than `??`, so an empty NEXT_PUBLIC_SITE_URL= line in an env file still falls back.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://tokenping.xyz").replace(/\/+$/, "");
export const SITE_NAME = "Tokenping";
export const TITLE_TEMPLATE = `%s | ${SITE_NAME}`;
const TITLE_SUFFIX = TITLE_TEMPLATE.replace("%s", "");
const MAX_TITLE_LENGTH = 60;
export const TWITTER_HANDLE = "@tokenping";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
/**
 * Profiles that identify the Organization (the highest-value JSON-LD field for entity resolution). The Signal group
 * invite is left out: it is a join link, not a public profile.
 */
export const SAME_AS = [SOCIAL_LINKS.x, SOCIAL_LINKS.telegram, SOURCE_CODE_URL];
/** 512x512 PNG of the Tokenping mark, served by app/logo.png/route.tsx. */
export const LOGO_PATH = "/logo.png";
const OG_SIZE = { width: 1200, height: 630 };
/**
 * Bump when the site card's design or words change: X, LinkedIn, Slack and the rest cache a card by its URL for days,
 * and the route's path has no hash to change for them. 2: the card names Morpho (26 October 2026).
 */
const SITE_OG_VERSION = 2;

/** The headline the site card draws, with this deployment's alert channels. */
export const siteOgTitle = (locale: Locale) =>
  SEO_MESSAGES[locale].siteOgTitle(formatAlertChannelsIn(locale, "conjunction"));

/** The site-wide social card of a language, served by app/og/[locale]/route.tsx, with alt text of what it shows. */
export const siteOgImage = (locale: Locale) => ({
  url: `/og/${locale}?v=${SITE_OG_VERSION}`,
  ...OG_SIZE,
  alt: SEO_MESSAGES[locale].siteOgAlt(siteOgTitle(locale)),
});

export const SITE_OG_IMAGE = siteOgImage(DEFAULT_LOCALE);

export const DEFAULT_TITLE = SEO_MESSAGES.en.defaultTitle;
export const DEFAULT_DESCRIPTION = SEO_MESSAGES.en.defaultDescription;

export const absoluteUrl = (path = "/") => new URL(path, `${SITE_URL}/`).toString();

const rssAlternate = (locale: Locale) => ({
  "application/rss+xml": [{ url: routePath(locale, "blogFeed"), title: SEO_MESSAGES[locale].rssTitle }],
});

/**
 * hreflang for the languages a page is published in; x-default is the English page when there is one. Undefined
 * for a page in one language only: hreflang only makes sense between translations.
 */
const languageAlternates = (paths: Partial<Localized<string>>) => {
  const published = LOCALES.filter(locale => paths[locale] !== undefined);
  if (published.length < 2) return undefined;
  return {
    ...Object.fromEntries(published.map(locale => [LOCALE_INFO[locale].htmlLang, paths[locale]])),
    ...(paths[DEFAULT_LOCALE] && { "x-default": paths[DEFAULT_LOCALE] }),
  };
};

/** Midnight UTC of a YYYY-MM-DD day: the one timestamp the byline, og:article times and JSON-LD all print. */
export const toIsoDateTime = (date: string) => `${date}T00:00:00Z`;

/** True when "title | Tokenping" would exceed 60 characters, so the brand suffix has to be dropped. */
export const needsAbsoluteTitle = (title: string) => title.length + TITLE_SUFFIX.length > MAX_TITLE_LENGTH;

const BRAND_PREFIX = `${SITE_NAME}: `;

/**
 * A title without the brand around it: no "Tokenping: " in front ("Tokenping: upozornění…" comes out capitalized) and no
 * " | Tokenping" after. Open Graph's og:title is the page's own title, without the site's name (og:site_name carries
 * that), and a page title that already ends in the suffix would get it twice from the template.
 */
export const withoutBrand = (title: string) => {
  const bare = title.endsWith(TITLE_SUFFIX) ? title.slice(0, -TITLE_SUFFIX.length) : title;
  return bare.startsWith(BRAND_PREFIX) ? capitalize(bare.slice(BRAND_PREFIX.length)) : bare;
};

type PageMetadataInput = {
  title: string;
  description: string;
  /** The page's language; English when left out. */
  locale?: Locale;
  /** Canonical path of a page that exists in one language only, e.g. "/admin". */
  path?: string;
  /**
   * The page's path in each language it is published in (i18n/routes): the canonical is this locale's, hreflang
   * lists them all. Leave out a language whose translation is not published.
   */
  alternates?: Partial<Localized<string>>;
  /** Bypasses the "%s | Tokenping" template. */
  absoluteTitle?: boolean;
  /** og:title and twitter:title when they should differ from the title; the title without the brand when left out. */
  socialTitle?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  /** YYYY-MM-DD, the same day as the visible byline. */
  publishedAt?: string;
  modifiedAt?: string;
  /**
   * The social card; the language's site card when left out.
   */
  ogImage?: typeof SITE_OG_IMAGE;
};

/**
 * Complete per-page metadata. Next merges metadata shallowly: a page that sets `alternates` or `openGraph` replaces
 * the parent's whole object (and the root's file-based og:image with it), so every page builds both here.
 */
export const pageMetadata = ({
  title,
  description,
  locale = DEFAULT_LOCALE,
  path,
  alternates,
  absoluteTitle = false,
  socialTitle = withoutBrand(title),
  noIndex = false,
  type = "website",
  publishedAt,
  modifiedAt,
  ogImage = siteOgImage(locale),
}: PageMetadataInput): Metadata => {
  const canonical = alternates?.[locale] ?? path ?? routePath(locale, "home");
  const languages = alternates && languageAlternates(alternates);
  return {
    title: absoluteTitle ? { absolute: title } : withoutBrand(title),
    description,
    alternates: {
      canonical,
      ...(languages && { languages }),
      types: rssAlternate(locale),
    },
    ...(noIndex && { robots: { index: false, follow: false } }),
    openGraph: {
      type,
      url: canonical,
      siteName: SITE_NAME,
      locale: LOCALE_INFO[locale].ogLocale,
      ...(languages && {
        alternateLocale: LOCALES.filter(other => other !== locale && alternates?.[other] !== undefined).map(
          other => LOCALE_INFO[other].ogLocale,
        ),
      }),
      title: socialTitle,
      description,
      images: [ogImage],
      ...(type === "article" &&
        publishedAt && {
          publishedTime: toIsoDateTime(publishedAt),
          modifiedTime: toIsoDateTime(modifiedAt ?? publishedAt),
          authors: [SITE_URL],
        }),
    },
    // No images: Next copies og:image into twitter:image when twitter sets none.
    twitter: { card: "summary_large_image", site: TWITTER_HANDLE, title: socialTitle, description },
  };
};

/** Root layout defaults. Never a canonical here: every child would inherit it and point at "/". */
export const rootMetadata = (locale: Locale = DEFAULT_LOCALE): Metadata => {
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  const bing = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
  const { defaultTitle, defaultDescription } = SEO_MESSAGES[locale];
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: defaultTitle, template: TITLE_TEMPLATE },
    description: defaultDescription,
    applicationName: SITE_NAME,
    manifest: "/manifest.json",
    alternates: { types: rssAlternate(locale) },
    // No images: every page sets its card through pageMetadata (the language's site card by default).
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: LOCALE_INFO[locale].ogLocale,
      title: withoutBrand(defaultTitle),
      description: defaultDescription,
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      title: withoutBrand(defaultTitle),
      description: defaultDescription,
    },
    ...((google || bing) && {
      verification: {
        ...(google && { google }),
        ...(bing && { other: { "msvalidate.01": bing } }),
      },
    }),
  };
};

const SCHEMA_CONTEXT = "https://schema.org";

const ORGANIZATION_REF = { "@id": ORGANIZATION_ID };
const ORGANIZATION_LOGO = { "@type": "ImageObject", url: absoluteUrl(LOGO_PATH), width: 512, height: 512 };
/**
 * The Organization as another page names it: its full node is on the homepages only, and a reader of one post does not
 * follow an @id to another page, so the name, URL and logo come along.
 */
const ORGANIZATION_SUMMARY = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: SITE_NAME,
  url: SITE_URL,
  logo: ORGANIZATION_LOGO,
};

/**
 * The homepages' JSON-LD graph: the Organization behind Tokenping and the WebSite it publishes, in both languages.
 * Google reads both from the home page (the WebSite there gives the site name in results), so no other page repeats
 * them. Nothing here the repo does not establish: no address, legal name or founding date.
 */
export const siteJsonLd = (locale: Locale = DEFAULT_LOCALE) => ({
  "@context": SCHEMA_CONTEXT,
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      url: SITE_URL,
      logo: ORGANIZATION_LOGO,
      description: SEO_MESSAGES[locale].organizationDescription,
      sameAs: SAME_AS,
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: LOCALES.map(code => LOCALE_INFO[code].htmlLang),
      publisher: ORGANIZATION_REF,
    },
  ],
});

/** One breadcrumb step. The last step is the current page and has no path. */
export type Crumb = {
  name: string;
  path?: string;
};

export const breadcrumbJsonLd = (crumbs: readonly Crumb[]) => ({
  "@context": SCHEMA_CONTEXT,
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map(({ name, path }, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name,
    ...(path !== undefined && index < crumbs.length - 1 && { item: absoluteUrl(path) }),
  })),
});

/**
 * The post's social card (app/og/[locale]/[slug]/route.tsx) with alt text naming the post.
 */
export const postOgImage = (meta: PostMeta, locale: Locale = DEFAULT_LOCALE) => ({
  url: `/og/${locale}/${meta.slug}`,
  ...OG_SIZE,
  alt: (meta.protocol === "morpho" ? SEO_MESSAGES[locale].morphoPostOgAlt : SEO_MESSAGES[locale].postOgAlt)(meta.title),
});

/** BlogPosting for one post, built from the same meta that renders the headline and byline. */
export const blogPostingJsonLd = (meta: PostMeta, locale: Locale = DEFAULT_LOCALE) => {
  const url = absoluteUrl(postPath(locale, meta.slug));
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BlogPosting",
    headline: meta.h1,
    description: meta.description,
    image: absoluteUrl(postOgImage(meta, locale).url),
    datePublished: toIsoDateTime(meta.publishedAt),
    dateModified: toIsoDateTime(meta.updatedAt ?? meta.publishedAt),
    author: ORGANIZATION_SUMMARY,
    publisher: ORGANIZATION_SUMMARY,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: LOCALE_INFO[locale].htmlLang,
  };
};

/**
 * FAQPage for questions a page shows, built from the same array it renders, so the markup cannot say anything the
 * page does not: each answer is the visible answer's text. Google shows no FAQ rich result for a site like this one, so
 * this is for the other readers of structured data (assistants and other engines), not for a search result.
 */
export const faqPageJsonLd = (
  questions: readonly { question: string; answer: ReactNode }[],
  locale: Locale = DEFAULT_LOCALE,
) => ({
  "@context": SCHEMA_CONTEXT,
  "@type": "FAQPage",
  inLanguage: LOCALE_INFO[locale].htmlLang,
  mainEntity: questions.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: reactNodeText(answer) },
  })),
});
