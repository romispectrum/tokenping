import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("en");

const NotFound = () => NotFoundPage({ locale: "en" });

export default NotFound;
