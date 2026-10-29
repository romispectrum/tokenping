import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("hi");

const NotFound = () => NotFoundPage({ locale: "hi" });

export default NotFound;
