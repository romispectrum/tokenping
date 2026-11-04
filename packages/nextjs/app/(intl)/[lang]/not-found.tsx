import { LocalizedNotFoundPage } from "~~/components/pages/LocalizedNotFoundPage";
import { notFoundMetadata } from "~~/components/pages/NotFoundPage";
import { type LangParams, segmentLocale } from "~~/i18n/localeSegment";
import { DEFAULT_LOCALE } from "~~/i18n/locales";

// Next resolves a not-found file's metadata with its segment's params, though the component gets none.
export const generateMetadata = async ({ params }: LangParams) =>
  notFoundMetadata(segmentLocale((await params).lang) ?? DEFAULT_LOCALE);

export default LocalizedNotFoundPage;
