import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("tr");

const Blog = () => BlogIndexPage({ locale: "tr" });

export default Blog;
