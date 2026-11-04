import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("sl");

const Blog = () => BlogIndexPage({ locale: "sl" });

export default Blog;
