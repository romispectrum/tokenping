import Link from "next/link";
import { NotFoundMessage, NotFoundShell } from "~~/components/pages/NotFoundView";
import { DEFAULT_LOCALE, LOCALES, LOCALE_INFO, type Locale } from "~~/i18n/locales";
import { COMMON_MESSAGES } from "~~/i18n/messages/common";
import { routePath } from "~~/i18n/routes";

/** The 404's <title>. Next adds the noindex robots tag to every 404 itself. */
export const notFoundMetadata = (locale: Locale) => ({ title: COMMON_MESSAGES[locale].notFound.title });

/**
 * The 404 of one language. The kicker carries the code, the h1 says what happened, and the home page link is the
 * view's one pink action.
 */
export const NotFoundPage = ({ locale }: { locale: Locale }) => (
  <NotFoundShell>
    <NotFoundMessage locale={locale} t={COMMON_MESSAGES[locale].notFound} headingId="not-found-title" />
  </NotFoundShell>
);

/**
 * The 404 for a URL that matches no route (app/global-not-found.tsx), which cannot tell the language: English with
 * its h1 and the pink home link, then under a hairline every other language's home page, named in that language.
 */
export const MultilingualNotFoundPage = () => (
  <NotFoundShell>
    <NotFoundMessage locale={DEFAULT_LOCALE} t={COMMON_MESSAGES[DEFAULT_LOCALE].notFound} headingId="not-found-title" />
    <nav aria-label={COMMON_MESSAGES[DEFAULT_LOCALE].header.language} className="mt-10 border-t border-border pt-8">
      <ul className="m-0 flex list-none flex-wrap justify-center gap-x-5 gap-y-2 p-0">
        {LOCALES.filter(locale => locale !== DEFAULT_LOCALE).map(locale => {
          const { htmlLang, name } = LOCALE_INFO[locale];
          return (
            <li key={locale} className="m-0 p-0">
              <Link href={routePath(locale, "home")} hrefLang={htmlLang} lang={htmlLang} className="text-link">
                {name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  </NotFoundShell>
);
