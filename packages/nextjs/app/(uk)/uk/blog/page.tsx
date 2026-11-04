import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("uk");

const Blog = () => BlogIndexPage({ locale: "uk" });

export default Blog;
