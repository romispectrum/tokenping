import { rootDocument } from "~~/components/RootDocument";
import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";
import { localeFromPath } from "~~/i18n/routes";
import { rootMetadata } from "~~/utils/seo";

// A URL that matches no route renders outside both root layouts, so this page brings its own document. It cannot
// see the path, so it is English, and its links include the Czech home page through the header's language switch.
export const metadata = { ...rootMetadata(localeFromPath("/")), ...notFoundMetadata("en") };

const GlobalNotFound = () => rootDocument({ locale: "en", children: <NotFoundPage locale="en" /> });

export default GlobalNotFound;
