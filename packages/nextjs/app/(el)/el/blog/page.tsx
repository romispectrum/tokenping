import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("el");

const Blog = () => BlogIndexPage({ locale: "el" });

export default Blog;
