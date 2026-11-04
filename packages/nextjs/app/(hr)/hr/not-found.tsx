import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("hr");

const NotFound = () => NotFoundPage({ locale: "hr" });

export default NotFound;
