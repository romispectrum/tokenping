import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("pl");

const Blog = () => BlogIndexPage({ locale: "pl" });

export default Blog;
