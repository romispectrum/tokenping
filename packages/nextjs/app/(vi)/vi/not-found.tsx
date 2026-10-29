import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("vi");

const NotFound = () => NotFoundPage({ locale: "vi" });

export default NotFound;
