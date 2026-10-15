import type { Metadata } from "next";
import { AAVE_MARKETS } from "~~/config/aaveConfig";
import { SOCIAL_LINKS } from "~~/constants/links";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import type { PostMeta } from "~~/content/blog/types";

// Canonicals, the sitemap, RSS and JSON-LD always name production, also on previews and local or IPFS builds.
// `||` rather than `??`, so an empty NEXT_PUBLIC_SITE_URL= line in an env file still falls back.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://tokenping.xyz").replace(/\/+$/, "");
export const SITE_NAME = "Tokenping";
export const TITLE_TEMPLATE = `%s | ${SITE_NAME}`;
const TITLE_SUFFIX = TITLE_TEMPLATE.replace("%s", "");
const MAX_TITLE_LENGTH = 60;
export const TWITTER_HANDLE = "@tokenping";
export const RSS_PATH = "/blog/feed.xml";
export const RSS_TITLE = `${SITE_NAME} blog`;
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
/**
 * Profiles that identify the Organization (the highest-value JSON-LD field for entity resolution). The GitHub repo
 * (https://github.com/romispectrum/tokenping) joins once its README describes Tokenping instead of Scaffold-ETH 2
 * (marketing plan §4.4).
 */
export const SAME_AS = [SOCIAL_LINKS.x, SOCIAL_LINKS.telegram];
/** 512x512 PNG of the Tokenping mark, served by app/logo.png/route.tsx. */
export const LOGO_PATH = "/logo.png";
/** The site-wide social card, served by app/opengraph-image.tsx. */
export const SITE_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Tokenping: Aave health factor alerts",
};

export const DEFAULT_TITLE = "Tokenping: Aave health factor alerts";
export const DEFAULT_DESCRIPTION = `Alerts when your Aave V3 health factor drops below a threshold you choose, on ${AAVE_MARKETS.length} networks, checked every ${NOTIFICATION_CHECK_INTERVAL_MINUTES} minutes. The dashboard is free.`;
export const ORGANIZATION_DESCRIPTION =
  "Tokenping sends a message when an Aave V3 health factor drops below the threshold its owner set.";

export const absoluteUrl = (path = "/") => new URL(path, `${SITE_URL}/`).toString();

const RSS_ALTERNATE = { "application/rss+xml": [{ url: RSS_PATH, title: RSS_TITLE }] };

/** Midnight UTC of a YYYY-MM-DD day: the one timestamp the byline, og:article times and JSON-LD all print. */
export const toIsoDateTime = (date: string) => `${date}T00:00:00Z`;

/** True when "title | Tokenping" would exceed 60 characters, so the brand suffix has to be dropped. */
export const needsAbsoluteTitle = (title: string) => title.length + TITLE_SUFFIX.length > MAX_TITLE_LENGTH;

type PageMetadataInput = {
  title: string;
  description: string;
  /** Canonical path, e.g. "/", "/aave", "/blog/aave-health-factor". */
  path: string;
  /** Bypasses the "%s | Tokenping" template. */
  absoluteTitle?: boolean;
  noIndex?: boolean;
  type?: "website" | "article";
  /** YYYY-MM-DD, the same day as the visible byline. */
  publishedAt?: string;
  modifiedAt?: string;
  /**
   * The social card. `false` when the route has its own opengraph-image file: Next applies a segment's file image
   * only while the page's openGraph has no `images` key.
   */
  ogImage?: typeof SITE_OG_IMAGE | false;
};

/**
 * Complete per-page metadata. Next merges metadata shallowly: a page that sets `alternates` or `openGraph` replaces
 * the parent's whole object (and the root's file-based og:image with it), so every page builds both here.
 */
export const pageMetadata = ({
  title,
  description,
  path,
  absoluteTitle = false,
  noIndex = false,
  type = "website",
  publishedAt,
  modifiedAt,
  ogImage = SITE_OG_IMAGE,
}: PageMetadataInput): Metadata => ({
  title: absoluteTitle ? { absolute: title } : title,
  description,
  alternates: { canonical: path, types: RSS_ALTERNATE },
  ...(noIndex && { robots: { index: false, follow: false } }),
  openGraph: {
    type,
    url: path,
    siteName: SITE_NAME,
    locale: "en_US",
    title,
    description,
    ...(ogImage && { images: [ogImage] }),
    ...(type === "article" &&
      publishedAt && {
        publishedTime: toIsoDateTime(publishedAt),
        modifiedTime: toIsoDateTime(modifiedAt ?? publishedAt),
        authors: [SITE_URL],
      }),
  },
  // No images: Next copies og:image into twitter:image when twitter sets none.
  twitter: { card: "summary_large_image", site: TWITTER_HANDLE, title, description },
});

/** Root layout defaults. Never a canonical here: every child would inherit it and point at "/". */
export const rootMetadata = (): Metadata => {
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  const bing = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: DEFAULT_TITLE, template: TITLE_TEMPLATE },
    description: DEFAULT_DESCRIPTION,
    applicationName: SITE_NAME,
    manifest: "/manifest.json",
    alternates: { types: RSS_ALTERNATE },
    // No images: app/opengraph-image.tsx supplies the root card.
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
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

/** The site-wide JSON-LD graph: the Organization behind Tokenping and the WebSite it publishes. */
export const siteJsonLd = () => ({
  "@context": SCHEMA_CONTEXT,
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: absoluteUrl(LOGO_PATH), width: 512, height: 512 },
      description: ORGANIZATION_DESCRIPTION,
      sameAs: SAME_AS,
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "en",
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

export const postPath = (slug: string) => `/blog/${slug}`;

/**
 * The post's social card (app/blog/[slug]/opengraph-image.tsx) with alt text naming the post. Set on the page because
 * a file image's `alt` export is one static string for every slug.
 */
export const postOgImage = (meta: PostMeta) => ({
  url: `${postPath(meta.slug)}/opengraph-image`,
  width: SITE_OG_IMAGE.width,
  height: SITE_OG_IMAGE.height,
  alt: `${meta.title} (${SITE_NAME} Aave V3 guide)`,
});

/** BlogPosting for one post, built from the same meta that renders the headline and byline. */
export const blogPostingJsonLd = (meta: PostMeta) => {
  const url = absoluteUrl(postPath(meta.slug));
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BlogPosting",
    headline: meta.h1,
    description: meta.description,
    image: absoluteUrl(postOgImage(meta).url),
    datePublished: toIsoDateTime(meta.publishedAt),
    dateModified: toIsoDateTime(meta.updatedAt ?? meta.publishedAt),
    author: { "@type": "Organization", "@id": ORGANIZATION_ID, name: SITE_NAME, url: SITE_URL },
    publisher: ORGANIZATION_REF,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: "en",
  };
};
