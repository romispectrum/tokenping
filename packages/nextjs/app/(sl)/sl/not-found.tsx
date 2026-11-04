import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("sl");

const NotFound = () => NotFoundPage({ locale: "sl" });

export default NotFound;
