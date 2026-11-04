import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("hr");

const Blog = () => BlogIndexPage({ locale: "hr" });

export default Blog;
