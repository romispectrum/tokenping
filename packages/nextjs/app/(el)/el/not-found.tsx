import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("el");

const NotFound = () => NotFoundPage({ locale: "el" });

export default NotFound;
