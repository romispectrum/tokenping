import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("uk");

const NotFound = () => NotFoundPage({ locale: "uk" });

export default NotFound;
