import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("ru");

const Blog = () => BlogIndexPage({ locale: "ru" });

export default Blog;
