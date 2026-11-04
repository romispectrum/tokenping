import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";
import { LOCALE_PATHS } from "~~/i18n/localePaths";
import { type LangParams, pageLocale, requireSegmentLocale } from "~~/i18n/localeSegment";

// Each language's privacy page sits under its own word (/de/datenschutz, /cz/ochrana-soukromi); any other word is a
// 404.
export const dynamicParams = false;
export const generateStaticParams = ({ params }: { params: { lang: string } }) => [
  { privacy: LOCALE_PATHS[requireSegmentLocale(params.lang)].privacy },
];

export const generateMetadata = async (props: LangParams) => privacyMetadata(await pageLocale(props));

const Privacy = async (props: LangParams) => PrivacyPage({ locale: await pageLocale(props) });

export default Privacy;
