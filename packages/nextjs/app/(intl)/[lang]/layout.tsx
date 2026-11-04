import type { ReactNode } from "react";
import { ROOT_VIEWPORT, rootDocument } from "~~/components/RootDocument";
import { localeFontClasses } from "~~/components/fonts";
import { PrefixedLocaleRoot } from "~~/i18n/client/roots";
import { LANG_PARAMS, type LangParams, pageLocale } from "~~/i18n/localeSegment";
import { rootMetadata } from "~~/utils/seo";

// The root layout of every language but English, which is app/(en). The languages are known at build time; any other
// first segment is not a language, and a 404.
export const dynamicParams = false;
export const generateStaticParams = () => LANG_PARAMS;

export const generateMetadata = async (props: LangParams) => rootMetadata(await pageLocale(props));
export const viewport = ROOT_VIEWPORT;

const RootLayout = async ({ children, ...props }: LangParams & { children: ReactNode }) => {
  const locale = await pageLocale(props);
  return rootDocument({
    locale,
    body: <PrefixedLocaleRoot locale={locale}>{children}</PrefixedLocaleRoot>,
    fontClassName: localeFontClasses(locale),
  });
};

export default RootLayout;
