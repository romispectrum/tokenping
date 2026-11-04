import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";
import { type LangParams, pageLocale } from "~~/i18n/localeSegment";

export const generateMetadata = async (props: LangParams) => blogIndexMetadata(await pageLocale(props));

const Blog = async (props: LangParams) => BlogIndexPage({ locale: await pageLocale(props) });

export default Blog;
