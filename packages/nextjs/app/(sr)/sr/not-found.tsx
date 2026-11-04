import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("sr");

const NotFound = () => NotFoundPage({ locale: "sr" });

export default NotFound;
