import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("sv");

const NotFound = () => NotFoundPage({ locale: "sv" });

export default NotFound;
