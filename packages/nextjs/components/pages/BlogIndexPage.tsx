import Link from "next/link";
import { BookOpen, Rss } from "lucide-react";
import { PostSummary } from "~~/components/blog/PostSummary";
import { BLOG_CONTAINER_CLASS_NAME, HEADER_WASH_CLASS_NAME } from "~~/components/blog/blogLayout";
import { Breadcrumbs } from "~~/components/seo/Breadcrumbs";
import { JsonLd } from "~~/components/seo/JsonLd";
import { EmptyState } from "~~/components/ui/EmptyState";
import { Glow } from "~~/components/ui/Glow";
import { GrainCard } from "~~/components/ui/GrainCard";
import { Kicker } from "~~/components/ui/Kicker";
import { SectionHeader } from "~~/components/ui/SectionHeader";
import { buttonClasses } from "~~/components/ui/buttonClasses";
import { cx } from "~~/components/ui/classNames";
import { getPublishedPosts, hubSlug } from "~~/content/blog";
import { DEFAULT_LOCALE, type Locale } from "~~/i18n/locales";
import { BLOG_MESSAGES } from "~~/i18n/messages/blog";
import { routeAlternates, routePath } from "~~/i18n/routes";
import { type Crumb, breadcrumbJsonLd, pageMetadata } from "~~/utils/seo";

export const blogIndexMetadata = (locale: Locale) =>
  pageMetadata({
    title: BLOG_MESSAGES[locale].index.title,
    description: BLOG_MESSAGES[locale].index.description,
    locale,
    alternates: routeAlternates("blog"),
    // An index with no articles yet is a thin page: indexable from the first published post on.
    noIndex: getPublishedPosts(locale).length === 0,
  });

const crumbs = (locale: Locale): Crumb[] => {
  const { home, blog } = BLOG_MESSAGES[locale].crumbs;
  return [{ name: home, path: routePath(locale, "home") }, { name: blog }];
};

const HERO_ACTION_CLASS_NAME = "w-full sm:w-auto sm:min-w-40";

/**
 * The hero is the page's marketing moment (wash, glow, grain card, the one pink action); the guide list below it is
 * plain, with the marketing cards.
 */
export const BlogIndexPage = ({ locale }: { locale: Locale }) => {
  const posts = getPublishedPosts(locale);
  const hub = posts.find(({ meta }) => meta.slug === hubSlug(locale));
  const spokes = posts.filter(post => post !== hub);
  const CRUMBS = crumbs(locale);
  const t = BLOG_MESSAGES[locale].index;

  return (
    <div className="flex-1">
      <section aria-labelledby="blog-title" className="relative isolate overflow-hidden pt-6 pb-16 md:pt-12 md:pb-24">
        <div aria-hidden="true" className={HEADER_WASH_CLASS_NAME} />
        <div className={BLOG_CONTAINER_CLASS_NAME}>
          <Breadcrumbs crumbs={CRUMBS} locale={locale} />
          {/* The glow anchors to the card's corner; the wrapper's radius clips it to the card's shape. */}
          <div className="relative rounded-3xl">
            <Glow placement="bottom-right" />
            <GrainCard className="px-6 py-10 text-center sm:px-10 md:px-12 md:py-14 lg:px-16 lg:py-16">
              <div className="mx-auto max-w-3xl">
                <Kicker>{t.kicker}</Kicker>
                <h1 id="blog-title" className="text-display mb-0">
                  {t.title}
                </h1>
                {/* foreground, not muted: the glow can tint the card behind this line */}
                <p className="text-lead mx-auto mt-4 mb-0 max-w-[50ch] text-pretty text-foreground md:text-xl">
                  {t.lead}
                </p>
                <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
                  <Link
                    href={routePath(locale, "dashboard")}
                    className={buttonClasses({ size: "lg", className: HERO_ACTION_CLASS_NAME })}
                  >
                    {t.dashboardCta}
                  </Link>
                  {/* A plain <a>: the feed is a route handler, not a page next/link could prefetch. */}
                  <a
                    href={routePath(locale, "blogFeed")}
                    className={buttonClasses({ variant: "outline", size: "lg", className: HERO_ACTION_CLASS_NAME })}
                  >
                    <Rss aria-hidden="true" />
                    {t.rss}
                  </a>
                </div>
              </div>
            </GrainCard>
          </div>
        </div>
      </section>

      <div className={cx(BLOG_CONTAINER_CLASS_NAME, "pb-12 md:pb-20")}>
        {hub && (
          <section aria-label={t.startHere}>
            <PostSummary meta={hub.meta} locale={locale} featured />
          </section>
        )}

        {spokes.length > 0 && (
          <section aria-labelledby="all-guides" className={cx(hub && "mt-12 md:mt-20")}>
            <SectionHeader id="all-guides" title={t.allGuides} align="start" />
            <ul role="list" className="m-0 grid list-none gap-6 p-0 md:grid-cols-2 lg:grid-cols-3">
              {spokes.map(({ meta }) => (
                <li key={meta.slug} className="m-0 p-0">
                  <PostSummary meta={meta} locale={locale} as="h3" />
                </li>
              ))}
            </ul>
          </section>
        )}

        {posts.length === 0 && (
          <EmptyState
            icon={BookOpen}
            title={t.empty.title}
            description={t.empty.description}
            // While a translation has no published guides, point to the English ones, which exist already.
            action={
              t.empty.otherLanguage && (
                <Link
                  href={routePath(DEFAULT_LOCALE, "blog")}
                  hrefLang={DEFAULT_LOCALE}
                  className={buttonClasses({ variant: "outline" })}
                >
                  {t.empty.otherLanguage}
                </Link>
              )
            }
          />
        )}
      </div>

      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
    </div>
  );
};
