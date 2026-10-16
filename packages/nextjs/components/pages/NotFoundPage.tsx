import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "~~/components/home/marketingLayout";
import { GrainCard } from "~~/components/ui/GrainCard";
import { Kicker } from "~~/components/ui/Kicker";
import { buttonClasses } from "~~/components/ui/buttonClasses";
import { LOCALE_INFO, type Locale } from "~~/i18n/locales";
import { COMMON_MESSAGES } from "~~/i18n/messages/common";
import { routePath } from "~~/i18n/routes";

/** The 404's <title>. Next adds the noindex robots tag to every 404 itself. */
export const notFoundMetadata = (locale: Locale) => ({ title: COMMON_MESSAGES[locale].notFound.title });

// Verb first, naming the destination.
const notFoundLinks = (locale: Locale) => {
  const t = COMMON_MESSAGES[locale].notFound;
  return [
    { href: routePath(locale, "home"), label: t.home },
    { href: routePath(locale, "dashboard"), label: t.dashboard },
    { href: routePath(locale, "blog"), label: t.blog },
  ];
};

type NotFoundMessageProps = {
  locale: Locale;
  /** The id of the heading, which names the section. */
  headingId?: string;
  /** The page's h1, or the h2 of the translation under it on the bilingual 404. */
  headingLevel?: 1 | 2;
  /** Only the first message's home link is the view's pink action. */
  primary?: boolean;
};

/** The kicker with the code, the heading that says what happened, one sentence and the links, in one language. */
const NotFoundMessage = ({ locale, headingId, headingLevel = 1, primary = true }: NotFoundMessageProps) => {
  const t = COMMON_MESSAGES[locale].notFound;
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <>
      <Kicker>{t.kicker}</Kicker>
      <Heading id={headingId} className="text-section my-0 text-balance">
        {t.title}
      </Heading>
      <p className="text-lead mx-auto mt-4 mb-0 max-w-[48ch] text-pretty text-foreground">{t.text}</p>
      <nav aria-label={t.navLabel} className="mt-8">
        <ul className="m-0 flex list-none flex-col items-center gap-3 p-0 sm:flex-row sm:flex-wrap sm:justify-center">
          {notFoundLinks(locale).map(({ href, label }, index) => (
            <li key={href} className="m-0 w-full max-w-sm p-0 sm:w-auto">
              <Link
                href={href}
                className={buttonClasses({
                  variant: primary && index === 0 ? "default" : "outline",
                  size: "lg",
                  className: "w-full sm:w-auto sm:min-w-32",
                })}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

/** The marketing surface of the 404: the lavender wash and one grain card. */
const NotFoundShell = ({ children }: { children: ReactNode }) => (
  <section
    aria-labelledby="not-found-title"
    className="flex flex-1 items-center bg-linear-to-b from-accent/70 via-background to-background py-16 md:py-24 dark:from-accent/40"
  >
    <Container>
      <GrainCard className="mx-auto max-w-2xl px-6 py-10 text-center sm:px-10 md:py-14">{children}</GrainCard>
    </Container>
  </section>
);

/**
 * The 404 of one language. The kicker carries the code, the h1 says what happened, and the home page link is the
 * view's one pink action.
 */
export const NotFoundPage = ({ locale }: { locale: Locale }) => (
  <NotFoundShell>
    <NotFoundMessage locale={locale} headingId="not-found-title" />
  </NotFoundShell>
);

/**
 * The 404 for a URL that matches no route (app/global-not-found.tsx), which cannot tell the language: English with
 * its h1 and the pink home link, then the same message in Czech (lang="cs", an h2, outline links to the Czech pages)
 * under a hairline.
 */
export const BilingualNotFoundPage = () => (
  <NotFoundShell>
    <NotFoundMessage locale="en" headingId="not-found-title" />
    <div lang={LOCALE_INFO.cs.htmlLang} className="mt-10 border-t border-border pt-10">
      <NotFoundMessage locale="cs" headingLevel={2} primary={false} />
    </div>
  </NotFoundShell>
);
