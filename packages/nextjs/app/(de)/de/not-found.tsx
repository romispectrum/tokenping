import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("de");

const NotFound = () => NotFoundPage({ locale: "de" });

export default NotFound;
