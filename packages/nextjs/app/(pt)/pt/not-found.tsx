import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("pt");

const NotFound = () => NotFoundPage({ locale: "pt" });

export default NotFound;
