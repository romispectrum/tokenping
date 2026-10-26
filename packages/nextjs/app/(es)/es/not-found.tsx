import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("es");

const NotFound = () => NotFoundPage({ locale: "es" });

export default NotFound;
