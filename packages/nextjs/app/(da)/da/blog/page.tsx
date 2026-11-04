import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("da");

const Blog = () => BlogIndexPage({ locale: "da" });

export default Blog;
