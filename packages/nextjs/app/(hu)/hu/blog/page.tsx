import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("hu");

const Blog = () => BlogIndexPage({ locale: "hu" });

export default Blog;
