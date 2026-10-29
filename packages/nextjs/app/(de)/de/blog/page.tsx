import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("de");

const Blog = () => BlogIndexPage({ locale: "de" });

export default Blog;
