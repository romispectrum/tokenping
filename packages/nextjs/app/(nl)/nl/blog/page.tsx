import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("nl");

const Blog = () => BlogIndexPage({ locale: "nl" });

export default Blog;
