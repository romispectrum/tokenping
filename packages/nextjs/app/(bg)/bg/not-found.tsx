import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("bg");

const NotFound = () => NotFoundPage({ locale: "bg" });

export default NotFound;
