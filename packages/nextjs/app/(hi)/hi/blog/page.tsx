import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("hi");

const Blog = () => BlogIndexPage({ locale: "hi" });

export default Blog;
