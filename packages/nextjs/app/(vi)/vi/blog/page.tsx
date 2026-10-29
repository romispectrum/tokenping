import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("vi");

const Blog = () => BlogIndexPage({ locale: "vi" });

export default Blog;
