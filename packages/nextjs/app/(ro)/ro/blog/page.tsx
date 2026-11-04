import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("ro");

const Blog = () => BlogIndexPage({ locale: "ro" });

export default Blog;
