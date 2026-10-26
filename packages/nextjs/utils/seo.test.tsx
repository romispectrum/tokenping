import { afterEach, describe, expect, it, vi } from "vitest";
import type { PostMeta } from "~~/content/blog/types";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  ORGANIZATION_ID,
  SITE_OG_IMAGE,
  WEBSITE_ID,
  absoluteUrl,
  blogPostingJsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
  needsAbsoluteTitle,
  pageMetadata,
  postOgImage,
  rootMetadata,
  siteJsonLd,
  siteOgImage,
  siteOgTitle,
  toIsoDateTime,
  withoutBrand,
} from "~~/utils/seo";

// SITE_URL is read at module load, so these cases import a fresh copy.
const loadSeo = async (siteUrl: string | undefined) => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", siteUrl);
  return import("~~/utils/seo");
};

const ORGANIZATION = {
  "@type": "Organization",
  "@id": "https://tokenping.xyz/#organization",
  name: "Tokenping",
  url: "https://tokenping.xyz",
  logo: { "@type": "ImageObject", url: "https://tokenping.xyz/logo.png", width: 512, height: 512 },
};

const RSS = { "application/rss+xml": [{ url: "/blog/feed.xml", title: "Tokenping blog" }] };

const META: PostMeta = {
  slug: "aave-health-factor",
  title: "Aave health factor explained: formula and examples",
  description: "What the Aave V3 health factor is.",
  h1: "What is the Aave health factor, and how is it calculated?",
  publishedAt: "2026-10-14",
  primaryQuestion: "What is the Aave health factor and how is it calculated?",
  readingMinutes: 9,
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("SITE_URL", () => {
  it.each([
    [undefined, "https://tokenping.xyz"],
    ["", "https://tokenping.xyz"],
    ["https://preview.example.com/", "https://preview.example.com"],
    ["https://preview.example.com//", "https://preview.example.com"],
  ])("NEXT_PUBLIC_SITE_URL=%j gives %j, never a localhost fallback", async (value, expected) => {
    const { SITE_URL, absoluteUrl: toAbsolute } = await loadSeo(value);

    expect(SITE_URL).toBe(expected);
    expect(toAbsolute("/blog")).toBe(`${expected}/blog`);
  });
});

describe("absoluteUrl", () => {
  it("resolves paths against the production origin", () => {
    expect(absoluteUrl()).toBe("https://tokenping.xyz/");
    expect(absoluteUrl("/blog/aave-health-factor")).toBe("https://tokenping.xyz/blog/aave-health-factor");
  });
});

describe("needsAbsoluteTitle", () => {
  it("drops the brand suffix only when 'title | Tokenping' would exceed 60 characters", () => {
    expect(needsAbsoluteTitle("x".repeat(48))).toBe(false);
    expect(needsAbsoluteTitle("x".repeat(49))).toBe(true);
    expect(needsAbsoluteTitle("How to get notified when your Aave health factor drops")).toBe(true);
    expect(needsAbsoluteTitle("Aave liquidation alert tools compared (2026)")).toBe(false);
  });
});

describe("pageMetadata", () => {
  it("returns the complete canonical, RSS alternate, Open Graph and Twitter objects", () => {
    expect(pageMetadata({ title: "Guides", description: "All guides.", path: "/blog" })).toEqual({
      title: "Guides",
      description: "All guides.",
      alternates: { canonical: "/blog", types: RSS },
      openGraph: {
        type: "website",
        url: "/blog",
        siteName: "Tokenping",
        locale: "en_US",
        title: "Guides",
        description: "All guides.",
        images: [SITE_OG_IMAGE],
      },
      twitter: { card: "summary_large_image", site: "@tokenping", title: "Guides", description: "All guides." },
    });
  });

  // og:title is the page's own title: the brand is og:site_name, and the template adds it to <title> only.
  it("keeps the brand out of og:title and twitter:title, and never doubles the suffix", () => {
    const branded = pageMetadata({ title: "Privacy | Tokenping", description: "d", path: "/privacy" });

    expect(branded.title).toBe("Privacy");
    expect(branded.openGraph).toMatchObject({ title: "Privacy" });
    expect(branded.twitter).toMatchObject({ title: "Privacy" });

    const home = pageMetadata({
      title: "Tokenping: Aave and Morpho health factor alerts",
      socialTitle: "Aave and Morpho health factor alerts on Signal and email",
      description: "d",
      path: "/",
      absoluteTitle: true,
    });
    expect(home.title).toEqual({ absolute: "Tokenping: Aave and Morpho health factor alerts" });
    expect(home.openGraph).toMatchObject({ title: "Aave and Morpho health factor alerts on Signal and email" });
    expect(home.twitter).toMatchObject({ title: "Aave and Morpho health factor alerts on Signal and email" });
  });

  it("supports an absolute title and noindex", () => {
    const metadata = pageMetadata({ title: "Home", description: "d", path: "/", absoluteTitle: true, noIndex: true });

    expect(metadata.title).toEqual({ absolute: "Home" });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("adds article times and the post's own card", () => {
    const metadata = pageMetadata({
      title: "Post",
      description: "d",
      path: "/blog/post",
      type: "article",
      publishedAt: "2026-10-14",
      ogImage: postOgImage(META),
    });

    expect(metadata.openGraph).toMatchObject({
      type: "article",
      url: "/blog/post",
      publishedTime: "2026-10-14T00:00:00Z",
      modifiedTime: "2026-10-14T00:00:00Z",
      authors: ["https://tokenping.xyz"],
    });
    expect(metadata.openGraph).toHaveProperty("images", [postOgImage(META)]);
    // Next copies og:image into twitter:image when twitter sets none.
    expect(metadata.twitter).not.toHaveProperty("images");
  });

  it("uses modifiedAt for the modified time when the post was updated", () => {
    const metadata = pageMetadata({
      title: "Post",
      description: "d",
      path: "/blog/post",
      type: "article",
      publishedAt: "2026-10-14",
      modifiedAt: "2026-11-02",
    });

    expect(metadata.openGraph).toMatchObject({ modifiedTime: "2026-11-02T00:00:00Z" });
  });

  it("does not add article fields to website pages", () => {
    const metadata = pageMetadata({ title: "t", description: "d", path: "/", publishedAt: "2026-10-14" });

    expect(metadata.openGraph).not.toHaveProperty("publishedTime");
  });
});

describe("rootMetadata", () => {
  it("sets the production metadataBase, title template, site name and Twitter handle, with no canonical", () => {
    const metadata = rootMetadata();

    expect(metadata.metadataBase?.toString()).toBe("https://tokenping.xyz/");
    expect(metadata.title).toEqual({ default: DEFAULT_TITLE, template: "%s | Tokenping" });
    expect(metadata.description).toBe(DEFAULT_DESCRIPTION);
    expect(metadata.applicationName).toBe("Tokenping");
    expect(metadata.alternates).toEqual({ types: RSS });
    expect(metadata.openGraph).toEqual({
      type: "website",
      siteName: "Tokenping",
      locale: "en_US",
      title: "Aave and Morpho health factor alerts",
      description: DEFAULT_DESCRIPTION,
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      site: "@tokenping",
      title: "Aave and Morpho health factor alerts",
    });
    expect(metadata).not.toHaveProperty("icons");
    expect(metadata).not.toHaveProperty("verification");
  });

  it("keeps the default title and description within search-result lengths", () => {
    expect(DEFAULT_TITLE.length).toBeLessThanOrEqual(60);
    expect(DEFAULT_DESCRIPTION.length).toBeLessThanOrEqual(155);
  });

  it("adds Google and Bing verification tags from env", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION", "google-token");
    vi.stubEnv("NEXT_PUBLIC_BING_SITE_VERIFICATION", "bing-token");

    expect(rootMetadata().verification).toEqual({ google: "google-token", other: { "msvalidate.01": "bing-token" } });
  });

  it("adds only the verification that is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_BING_SITE_VERIFICATION", "bing-token");

    expect(rootMetadata().verification).toEqual({ other: { "msvalidate.01": "bing-token" } });
  });
});

describe("siteJsonLd", () => {
  it("describes the Organization with its profiles and the WebSite it publishes", () => {
    expect(siteJsonLd()).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://tokenping.xyz/#organization",
          name: "Tokenping",
          url: "https://tokenping.xyz",
          logo: { "@type": "ImageObject", url: "https://tokenping.xyz/logo.png", width: 512, height: 512 },
          description: expect.any(String),
          sameAs: [
            "https://x.com/tokenping",
            "https://t.me/tokenping_xyz",
            "https://github.com/romispectrum/tokenping",
          ],
        },
        {
          "@type": "WebSite",
          "@id": "https://tokenping.xyz/#website",
          name: "Tokenping",
          url: "https://tokenping.xyz",
          inLanguage: ["en", "cs", "es"],
          publisher: { "@id": ORGANIZATION_ID },
        },
      ],
    });
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers the steps from 1 and leaves the current page without an item", () => {
    expect(breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: "Post" }])).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://tokenping.xyz/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://tokenping.xyz/blog" },
        { "@type": "ListItem", position: 3, name: "Post" },
      ],
    });
  });

  it("drops the item of the last step even when it has a path", () => {
    const [, last] = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
    ]).itemListElement;

    expect(last).toEqual({ "@type": "ListItem", position: 2, name: "Blog" });
  });
});

describe("postOgImage", () => {
  // Fixed URLs served by app/og: an opengraph-image file inside a route group would get a hashed URL.
  it("points at the post's card route with alt text that names the post", () => {
    expect(postOgImage(META)).toEqual({
      url: "/og/en/aave-health-factor",
      width: 1200,
      height: 630,
      alt: "Aave health factor explained: formula and examples (Tokenping Aave V3 guide)",
    });
    expect(postOgImage({ ...META, slug: "other", title: "Other" }).alt).not.toBe(postOgImage(META).alt);
  });
});

describe("blogPostingJsonLd", () => {
  it("builds the BlogPosting from the post meta, with the byline's dates and the Organization as author", () => {
    expect(blogPostingJsonLd(META)).toEqual({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: META.h1,
      description: META.description,
      image: "https://tokenping.xyz/og/en/aave-health-factor",
      datePublished: "2026-10-14T00:00:00Z",
      dateModified: "2026-10-14T00:00:00Z",
      author: ORGANIZATION,
      publisher: ORGANIZATION,
      mainEntityOfPage: { "@type": "WebPage", "@id": "https://tokenping.xyz/blog/aave-health-factor" },
      url: "https://tokenping.xyz/blog/aave-health-factor",
      isPartOf: { "@id": WEBSITE_ID },
      inLanguage: "en",
    });
  });

  it("uses updatedAt as dateModified", () => {
    expect(blogPostingJsonLd({ ...META, updatedAt: "2026-11-02" }).dateModified).toBe(toIsoDateTime("2026-11-02"));
  });
});

describe("withoutBrand", () => {
  it.each([
    ["Tokenping: Aave and Morpho health factor alerts", "Aave and Morpho health factor alerts"],
    ["Tokenping: upozornění na health factor na Aave a Morpho", "Upozornění na health factor na Aave a Morpho"],
    ["Aave and Morpho health factor alerts | Tokenping", "Aave and Morpho health factor alerts"],
    // The brand inside a title is part of what the page is about, not a prefix or a suffix.
    ["Aave alerts and your privacy: what Tokenping stores", "Aave alerts and your privacy: what Tokenping stores"],
    ["Privacy", "Privacy"],
  ])("%j becomes %j", (title, expected) => {
    expect(withoutBrand(title)).toBe(expected);
  });
});

describe("faqPageJsonLd", () => {
  it("repeats each question and the text of its answer, links included, in the page's language", () => {
    const questions = [
      { question: "What does it cost?", answer: "3 USDC per 30 days." },
      {
        question: "What do you store?",
        answer: (
          <>
            Contact details. The <a href="/privacy">privacy page</a> has the list.
          </>
        ),
      },
    ];

    expect(faqPageJsonLd(questions, "cs")).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: "cs",
      mainEntity: [
        {
          "@type": "Question",
          name: "What does it cost?",
          acceptedAnswer: { "@type": "Answer", text: "3 USDC per 30 days." },
        },
        {
          "@type": "Question",
          name: "What do you store?",
          acceptedAnswer: { "@type": "Answer", text: "Contact details. The privacy page has the list." },
        },
      ],
    });
  });
});

describe("siteOgImage", () => {
  // Consumers cache a card by its URL, so a redesigned card needs a new one.
  it("names the card with a version, so a changed card is fetched again", () => {
    expect(SITE_OG_IMAGE.url).toBe("/og/en?v=2");
  });

  // The alt says what the card shows: its headline, channels included, and the brand.
  it.each([
    [false, "Aave and Morpho health factor alerts on Signal and email (Tokenping)"],
    [true, "Aave and Morpho health factor alerts on Signal, Telegram and email (Tokenping)"],
  ])("gives the card the alt text of its own headline (Telegram %s)", (telegram, alt) => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", telegram ? "tokenping_bot" : "");

    expect(siteOgImage("en").alt).toBe(alt);
    expect(siteOgImage("en").alt.startsWith(siteOgTitle("en"))).toBe(true);
  });
});
