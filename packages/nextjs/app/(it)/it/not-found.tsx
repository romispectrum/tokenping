import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("it");

const NotFound = () => NotFoundPage({ locale: "it" });

export default NotFound;
