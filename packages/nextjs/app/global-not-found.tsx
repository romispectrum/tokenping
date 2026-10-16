import { rootDocument } from "~~/components/RootDocument";
import { BilingualNotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";
import { localeFromPath } from "~~/i18n/routes";
import { rootMetadata } from "~~/utils/seo";

// A URL that matches no route renders outside both root layouts, so this page brings its own document. It cannot
// see the path, so the document and the chrome are English, and the message is in English and then in Czech, with
// links to the Czech pages.
export const metadata = { ...rootMetadata(localeFromPath("/")), ...notFoundMetadata("en") };

const GlobalNotFound = () => rootDocument({ locale: "en", children: <BilingualNotFoundPage /> });

export default GlobalNotFound;
