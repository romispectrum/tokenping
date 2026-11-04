import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("nl");

const NotFound = () => NotFoundPage({ locale: "nl" });

export default NotFound;
