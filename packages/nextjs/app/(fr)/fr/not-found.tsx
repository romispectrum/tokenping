import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("fr");

const NotFound = () => NotFoundPage({ locale: "fr" });

export default NotFound;
