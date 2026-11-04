import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("fil");

const NotFound = () => NotFoundPage({ locale: "fil" });

export default NotFound;
