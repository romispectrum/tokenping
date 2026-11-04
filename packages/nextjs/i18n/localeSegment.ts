import { notFound } from "next/navigation";
import { LOCALE_PATHS } from "~~/i18n/localePaths";
import { PREFIXED_LOCALES, type PrefixedLocale } from "~~/i18n/locales";

// Every language but English is served by app/(intl)/[lang]: the first URL segment is the language's prefix without
// its slash ("cz", "no"), not always its code ("cs", "nb").

/** The [lang] segment of a language: "/cz" → "cz". */
export const langSegment = (locale: PrefixedLocale) => LOCALE_PATHS[locale].prefix.slice(1);

/** generateStaticParams for app/(intl)/[lang]: one entry per prefixed language. */
export const LANG_PARAMS = PREFIXED_LOCALES.map(locale => ({ lang: langSegment(locale) }));

/** The language a [lang] segment names, or undefined when it names none. */
export const segmentLocale = (segment: string): PrefixedLocale | undefined =>
  PREFIXED_LOCALES.find(locale => langSegment(locale) === segment);

/** The language a [lang] segment names; a segment that names none is a 404. */
export const requireSegmentLocale = (segment: string): PrefixedLocale => segmentLocale(segment) ?? notFound();

/** The props Next passes to every page and layout under app/(intl)/[lang]. */
export type LangParams = { params: Promise<{ lang: string }> };

/** The language of a page's props (a 404 for a segment that names none). */
export const pageLocale = async ({ params }: LangParams) => requireSegmentLocale((await params).lang);
