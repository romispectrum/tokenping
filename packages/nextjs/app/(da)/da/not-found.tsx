import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("da");

const NotFound = () => NotFoundPage({ locale: "da" });

export default NotFound;
