import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("pl");

const NotFound = () => NotFoundPage({ locale: "pl" });

export default NotFound;
