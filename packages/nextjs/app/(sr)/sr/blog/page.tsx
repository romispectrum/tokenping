import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("sr");

const Blog = () => BlogIndexPage({ locale: "sr" });

export default Blog;
