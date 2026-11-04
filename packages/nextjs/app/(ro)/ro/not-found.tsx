import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("ro");

const NotFound = () => NotFoundPage({ locale: "ro" });

export default NotFound;
