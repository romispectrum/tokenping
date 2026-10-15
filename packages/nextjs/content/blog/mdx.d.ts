// @types/mdx types only the default export; every post also exports its `meta`.
declare module "*.mdx" {
  export const meta: import("~~/content/blog/types").PostMeta;
}
