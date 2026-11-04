import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("hu");

const NotFound = () => NotFoundPage({ locale: "hu" });

export default NotFound;
