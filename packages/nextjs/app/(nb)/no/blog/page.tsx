import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("nb");

const Blog = () => BlogIndexPage({ locale: "nb" });

export default Blog;
