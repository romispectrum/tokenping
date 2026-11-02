import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("fr");

const Blog = () => BlogIndexPage({ locale: "fr" });

export default Blog;
