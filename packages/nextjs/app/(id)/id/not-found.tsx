import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("id");

const NotFound = () => NotFoundPage({ locale: "id" });

export default NotFound;
