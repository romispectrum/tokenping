import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("en");

const Blog = () => BlogIndexPage({ locale: "en" });

export default Blog;
