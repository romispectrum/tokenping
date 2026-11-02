import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("id");

const Blog = () => BlogIndexPage({ locale: "id" });

export default Blog;
