import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("pt");

const Blog = () => BlogIndexPage({ locale: "pt" });

export default Blog;
