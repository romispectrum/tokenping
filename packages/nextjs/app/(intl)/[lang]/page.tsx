import { HomePage, homeMetadata } from "~~/components/pages/HomePage";
import { type LangParams, pageLocale } from "~~/i18n/localeSegment";

// Same cadence as the English home page (route config must be a literal).
export const revalidate = 3600;

export const generateMetadata = async (props: LangParams) => homeMetadata(await pageLocale(props));

const Home = async (props: LangParams) => HomePage({ locale: await pageLocale(props) });

export default Home;
