import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("tr");

const NotFound = () => NotFoundPage({ locale: "tr" });

export default NotFound;
