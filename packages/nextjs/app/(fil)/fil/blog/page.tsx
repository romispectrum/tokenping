import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("fil");

const Blog = () => BlogIndexPage({ locale: "fil" });

export default Blog;
