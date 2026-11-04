import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("bg");

const Blog = () => BlogIndexPage({ locale: "bg" });

export default Blog;
