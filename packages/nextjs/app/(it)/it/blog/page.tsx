import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("it");

const Blog = () => BlogIndexPage({ locale: "it" });

export default Blog;
