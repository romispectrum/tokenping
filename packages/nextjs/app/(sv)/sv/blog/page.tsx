import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("sv");

const Blog = () => BlogIndexPage({ locale: "sv" });

export default Blog;
