import { MorphoPage, morphoMetadata } from "~~/components/pages/MorphoPage";
import { type LangParams, pageLocale } from "~~/i18n/localeSegment";

export const generateMetadata = async (props: LangParams) => morphoMetadata(await pageLocale(props));

const Morpho = async (props: LangParams) => MorphoPage({ locale: await pageLocale(props) });

export default Morpho;
