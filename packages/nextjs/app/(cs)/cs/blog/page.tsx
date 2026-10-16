import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("cs");

const Blog = () => BlogIndexPage({ locale: "cs" });

export default Blog;
