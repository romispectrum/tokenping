import { BlogIndexPage, blogIndexMetadata } from "~~/components/pages/BlogIndexPage";

export const metadata = blogIndexMetadata("es");

const Blog = () => BlogIndexPage({ locale: "es" });

export default Blog;
