// Layout classes shared by /blog and the post pages.

/**
 * The page container: 1200px wide with a 20px gutter that grows to the iOS safe-area insets, the same edge as the
 * header and the footer.
 */
export const BLOG_CONTAINER_CLASS_NAME =
  "mx-auto w-full max-w-[1200px] pr-[max(1.25rem,env(safe-area-inset-right))] pl-[max(1.25rem,env(safe-area-inset-left))]";

/**
 * The reading column: about 75 characters per line of 17px Satoshi, a narrow face. Wide tables and the calculator
 * reach out of it from lg (see MdxElements and LiquidationCalculator).
 */
export const READING_COLUMN_CLASS_NAME = "mx-auto w-full max-w-[36rem]";

/** Article body type: 17px with a 1.75 line height. Paragraphs and lists inherit it. */
export const ARTICLE_BODY_CLASS_NAME = "text-[1.0625rem] leading-[1.75]";

const HEADER_WASH_GRADIENT = "bg-linear-to-b from-accent/70 via-background to-background dark:from-accent/40";

/**
 * The lavender wash behind the top of a marketing page: the accent tint fading into the page colour. It is a layer,
 * so put it first inside a `relative isolate` block, and it fills that block.
 */
export const HEADER_WASH_CLASS_NAME = `pointer-events-none absolute inset-0 -z-10 ${HEADER_WASH_GRADIENT}`;

/**
 * The same wash for a post, where the block also holds the article below the header: 20rem tall from the top, about
 * the height of the breadcrumb and the header, so the tint has faded out before the body starts.
 */
export const POST_HEADER_WASH_CLASS_NAME = `pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 ${HEADER_WASH_GRADIENT}`;

/** The wash of a closing area: background, the accent tint, background again. */
export const END_WASH_CLASS_NAME = "bg-linear-to-b from-background via-accent/60 to-background dark:via-accent/40";
