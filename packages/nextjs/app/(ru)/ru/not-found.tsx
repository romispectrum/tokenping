import { NotFoundPage, notFoundMetadata } from "~~/components/pages/NotFoundPage";

export const metadata = notFoundMetadata("ru");

const NotFound = () => NotFoundPage({ locale: "ru" });

export default NotFound;
