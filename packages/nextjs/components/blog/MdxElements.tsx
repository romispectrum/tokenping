import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import type { MDXComponents } from "mdx/types";
import { TableScrollRegion } from "~~/components/blog/TableScrollRegion";
import { headingId, textContent } from "~~/components/blog/headingId";
import { EXTERNAL_LINK_REL } from "~~/constants/links";

// The article body is calm: type, links and tables only. No glow, grain, wash or brand divider inside it.
// Paragraphs and lists inherit their size and colour, so the same MDX reads at body size in the article and at the
// smaller size inside a callout.

/** An inline link in running text: the link token (violet on light, cyan on dark), always underlined. */
const ARTICLE_LINK_CLASS_NAME = "text-link underline decoration-1 underline-offset-3 hover:decoration-2";

// scroll-mt keeps an anchored heading clear of the sticky header.
const H2 = ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => (
  <h2 id={headingId(textContent(children))} className="mt-12 mb-4 scroll-mt-24 text-2xl leading-snug" {...props}>
    {children}
  </h2>
);

const H3 = ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => (
  <h3 id={headingId(textContent(children))} className="mt-10 mb-3 scroll-mt-24 text-xl leading-snug" {...props}>
    {children}
  </h3>
);

const H4 = ({ children, ...props }: ComponentPropsWithoutRef<"h4">) => (
  <h4 id={headingId(textContent(children))} className="mt-8 mb-2 scroll-mt-24 text-lg leading-snug" {...props}>
    {children}
  </h4>
);

const Paragraph = (props: ComponentPropsWithoutRef<"p">) => <p className="my-5 leading-[1.75]" {...props} />;

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
  <ul className="my-5 list-disc space-y-2 pl-6 marker:text-muted-foreground" {...props} />
);

const OrderedList = (props: ComponentPropsWithoutRef<"ol">) => (
  <ol className="my-5 list-decimal space-y-2 pl-6 marker:text-muted-foreground" {...props} />
);

const ListItem = (props: ComponentPropsWithoutRef<"li">) => (
  <li className="pl-1 leading-[1.75] [&>ol]:my-2 [&>p]:my-1 [&>ul]:my-2" {...props} />
);

const Blockquote = (props: ComponentPropsWithoutRef<"blockquote">) => (
  <blockquote className="my-6 border-l-2 border-input pl-5 text-muted-foreground [&>p]:my-3" {...props} />
);

// Medium, not Bold: 700 is kept for numbers and table headers.
const Strong = (props: ComponentPropsWithoutRef<"strong">) => (
  <strong className="font-medium text-foreground" {...props} />
);

const InlineCode = (props: ComponentPropsWithoutRef<"code">) => (
  <code className="rounded-lg bg-muted px-1.5 py-0.5 text-[0.875em] break-words text-foreground" {...props} />
);

// Focusable, so a keyboard can scroll a long line sideways.
const Pre = (props: ComponentPropsWithoutRef<"pre">) => (
  <pre
    tabIndex={0}
    className="my-6 overflow-x-auto rounded-xl border border-border bg-secondary p-4 text-sm leading-relaxed text-secondary-foreground [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-[1em]"
    {...props}
  />
);

const HorizontalRule = (props: ComponentPropsWithoutRef<"hr">) => <hr className="my-10 border-border" {...props} />;

// A real <table> inside a focusable scroll region, so wide comparison tables scroll sideways on phones and keyboard
// users can scroll them too. The card frame and the muted header row are the shared article table; every cell
// keeps a minimum width, so a many-column table scrolls instead of crushing its text. From lg the table reaches 80px
// out of the reading column on each side, where the page has room.
const Table = (props: ComponentPropsWithoutRef<"table">) => (
  <TableScrollRegion className="overflow-x-auto rounded-2xl border border-border bg-card text-card-foreground shadow-card">
    <table className="w-full border-collapse text-left text-[0.9375rem] tabular-nums" {...props} />
  </TableScrollRegion>
);

const TableHead = (props: ComponentPropsWithoutRef<"thead">) => (
  <thead className="border-b border-border bg-muted" {...props} />
);

const TableRow = (props: ComponentPropsWithoutRef<"tr">) => (
  <tr className="border-t border-border first:border-t-0" {...props} />
);

const TableHeaderCell = (props: ComponentPropsWithoutRef<"th">) => (
  <th
    className="min-w-36 px-4 py-3 align-bottom lg:min-w-28 text-xs font-bold tracking-wide text-muted-foreground uppercase"
    {...props}
  />
);

// The first cell names the row, so it is Medium like a row header.
const TableCell = (props: ComponentPropsWithoutRef<"td">) => (
  <td className="min-w-36 px-4 py-3 align-top leading-relaxed first:font-medium lg:min-w-28" {...props} />
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
  tr: TableRow,
  th: TableHeaderCell,
  td: TableCell,
};
