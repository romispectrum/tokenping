import { rootDocument } from "~~/components/RootDocument";
import { MultilingualNotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";
import { localeFromPath } from "~~/i18n/routes";
import { rootMetadata } from "~~/utils/seo";

// A URL that matches no route renders outside every root layout, so this page brings its own document. It cannot
// see the path, so the document and the chrome are English, and the message is in English and then in every other
// language, with links to each language's pages.
export const metadata = { ...rootMetadata(localeFromPath("/")), ...notFoundMetadata("en") };

const GlobalNotFound = () => rootDocument({ locale: "en", children: <MultilingualNotFoundPage /> });

export default GlobalNotFound;
