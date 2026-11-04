import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("nb");

const NotFound = () => NotFoundPage({ locale: "nb" });

export default NotFound;
