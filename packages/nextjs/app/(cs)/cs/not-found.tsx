import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("cs");

const NotFound = () => NotFoundPage({ locale: "cs" });

export default NotFound;
