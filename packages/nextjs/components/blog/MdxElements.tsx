import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import type { MDXComponents } from "mdx/types";
import { headingId, textContent } from "~~/components/blog/headingId";
import { EXTERNAL_LINK_REL } from "~~/constants/links";

// Light and dark pairs follow the site's surfaces (base-content on light, gray/indigo tints on dark). Links use
// indigo-700 / indigo-300, which keep at least 4.5:1 on both article backgrounds; the theme's primary does not.
export const ARTICLE_LINK_CLASS_NAME =
  "link underline-offset-2 text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-200";

const H2 = ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => (
  <h2
    id={headingId(textContent(children))}
    className="mt-10 mb-3 scroll-mt-24 text-2xl font-bold leading-tight text-base-content"
    {...props}
  >
    {children}
  </h2>
);

const H3 = ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => (
  <h3
    id={headingId(textContent(children))}
    className="mt-8 mb-2 scroll-mt-24 text-xl font-semibold leading-snug text-base-content"
    {...props}
  >
    {children}
  </h3>
);

const H4 = ({ children, ...props }: ComponentPropsWithoutRef<"h4">) => (
  <h4
    id={headingId(textContent(children))}
    className="mt-6 mb-2 scroll-mt-24 text-lg font-semibold leading-snug text-base-content"
    {...props}
  >
    {children}
  </h4>
);

const Paragraph = (props: ComponentPropsWithoutRef<"p">) => (
  <p className="my-4 leading-relaxed text-base-content/90 dark:text-gray-200" {...props} />
);

/** Internal paths and fragments go through next/link; anything else is external. */
const Anchor = ({ href = "", children, ...props }: ComponentPropsWithoutRef<"a">) =>
  href.startsWith("/") || href.startsWith("#") ? (
    <Link href={href} className={ARTICLE_LINK_CLASS_NAME} {...props}>
      {children}
    </Link>
  ) : (
    <a href={href} rel={EXTERNAL_LINK_REL} className={`${ARTICLE_LINK_CLASS_NAME} break-words`} {...props}>
      {children}
    </a>
  );

const UnorderedList = (props: ComponentPropsWithoutRef<"ul">) => (
  <ul className="my-4 list-disc space-y-2 pl-6 marker:text-base-content/50 dark:text-gray-200" {...props} />
);

const OrderedList = (props: ComponentPropsWithoutRef<"ol">) => (
  <ol className="my-4 list-decimal space-y-2 pl-6 marker:text-base-content/60 dark:text-gray-200" {...props} />
);

const ListItem = (props: ComponentPropsWithoutRef<"li">) => (
  <li className="leading-relaxed pl-1 [&>p]:my-1 [&>ul]:my-2 [&>ol]:my-2" {...props} />
);

const Blockquote = (props: ComponentPropsWithoutRef<"blockquote">) => (
  <blockquote
    className="my-6 border-l-4 border-indigo-300 pl-4 text-base-content/80 dark:border-indigo-400/60 dark:text-gray-300"
    {...props}
  />
);

const Strong = (props: ComponentPropsWithoutRef<"strong">) => (
  <strong className="font-semibold text-base-content" {...props} />
);

const InlineCode = (props: ComponentPropsWithoutRef<"code">) => (
  <code
    className="rounded-md bg-base-200 px-1.5 py-0.5 font-mono text-[0.875em] break-words dark:bg-white/10"
    {...props}
  />
);

const Pre = (props: ComponentPropsWithoutRef<"pre">) => (
  <pre
    className="my-6 overflow-x-auto rounded-box bg-base-200 p-4 text-sm dark:bg-black/40 [&>code]:bg-transparent [&>code]:p-0"
    {...props}
  />
);

const HorizontalRule = (props: ComponentPropsWithoutRef<"hr">) => (
  <hr className="my-8 border-base-300 dark:border-white/10" {...props} />
);

// A real <table> inside a focusable scroll region, so wide comparison tables scroll sideways on phones and keyboard
// users can scroll them too.
const Table = (props: ComponentPropsWithoutRef<"table">) => (
  <div
    role="region"
    aria-label="Table, scrolls horizontally"
    tabIndex={0}
    className="my-6 overflow-x-auto rounded-box border border-base-300 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-white/10"
  >
    <table className="table table-sm sm:table-md w-full text-sm" {...props} />
  </div>
);

const TableHead = (props: ComponentPropsWithoutRef<"thead">) => (
  <thead className="bg-base-200 text-base-content dark:bg-white/5" {...props} />
);

const TableHeaderCell = (props: ComponentPropsWithoutRef<"th">) => (
  <th className="align-bottom font-semibold text-base-content" {...props} />
);

const TableCell = (props: ComponentPropsWithoutRef<"td">) => (
  <td className="align-top text-base-content/90 dark:text-gray-200" {...props} />
);

export const MDX_ELEMENTS: MDXComponents = {
  h2: H2,
  h3: H3,
  h4: H4,
  p: Paragraph,
  a: Anchor,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  blockquote: Blockquote,
  strong: Strong,
  code: InlineCode,
  pre: Pre,
  hr: HorizontalRule,
  table: Table,
  thead: TableHead,
  th: TableHeaderCell,
  td: TableCell,
};
