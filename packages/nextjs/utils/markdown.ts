// Markdown for agents: a public page's HTML turned into markdown for a request that sends `Accept: text/markdown`
// (next.config.ts rewrites those to app/md/[[...path]]/route.ts). Only <main> is converted: the header, footer and
// banners are the same on every page.
import { fromHtml } from "hast-util-from-html";
import { toMdast } from "hast-util-to-mdast";
import { gfmToMarkdown } from "mdast-util-gfm";
import { toMarkdown } from "mdast-util-to-markdown";

export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";

/** True when an Accept header lists text/markdown, the same test as the rewrite's `has` regex in next.config.ts. */
export const acceptsMarkdown = (accept: string | null) => accept?.includes("text/markdown") ?? false;

/** A rough token count for the x-markdown-tokens header: about four characters per token. */
export const estimateTokens = (markdown: string) => Math.ceil(markdown.length / 4);

type HastRoot = ReturnType<typeof fromHtml>;
type HastNode = HastRoot | HastRoot["children"][number];
type HastElement = Extract<HastNode, { type: "element" }>;
type MdastNode = ReturnType<typeof toMdast>;

const findElement = (node: HastNode, matches: (element: HastElement) => boolean): HastElement | undefined => {
  if (node.type === "element" && matches(node)) return node;
  if (!("children" in node)) return undefined;
  for (const child of node.children) {
    const found = findElement(child, matches);
    if (found) return found;
  }
  return undefined;
};

// Scripts (JSON-LD among them), styles and icons carry no prose, and neither do forms: their labels mean nothing
// without the controls.
const DROPPED_TAGS = new Set([
  ...["script", "style", "template", "noscript", "svg"],
  ...["form", "button", "input", "select", "textarea"],
]);

const classNames = ({ properties }: HastElement) =>
  Array.isArray(properties.className) ? properties.className.map(String) : [];

// The page as a desktop browser shows it: `md:hidden` content (a table's "scroll sideways" hint) is for phones, and a
// `hidden` class with no breakpoint that shows the element again hides it everywhere.
const HIDDEN_CLASS = /^(?:(?:sm|md|lg):)?hidden$/;
const SHOWN_CLASS = /^(?:sm|md|lg):(?:block|inline|inline-block|flex|inline-flex|grid|inline-grid|table|contents)$/;

const isHiddenOnDesktop = (element: HastElement) => {
  const names = classNames(element);
  return names.some(name => HIDDEN_CLASS.test(name)) && !names.some(name => SHOWN_CLASS.test(name));
};

/**
 * What a reader of the page would not get: hidden elements, anything hidden from assistive technology (decorative
 * icons and duplicates of visible text), live regions (status text that repeats what is on screen, or a loading
 * message) and images without alt text.
 */
const isDropped = (element: HastElement) => {
  const { tagName, properties } = element;
  return (
    DROPPED_TAGS.has(tagName) ||
    properties.hidden !== undefined ||
    String(properties.ariaHidden) === "true" ||
    properties.role === "status" ||
    properties.ariaLive !== undefined ||
    isHiddenOnDesktop(element) ||
    (tagName === "img" && !properties.alt)
  );
};

// Flex and grid items are laid out apart, so two <span>s in a flex column read as two lines on screen but would run
// together as "Prices dropETH falls" in markdown. Each item gets its own block, or a space around it where only inline
// content may go (in a byline <p>, or in an inline-flex box). Lists and tables keep their children, and list items,
// table parts and definition terms are never wrapped: the converter finds them by tag (a <dl> may group each term in a
// <div>).
const LAYOUT_CLASSES = new Set(["flex", "inline-flex", "grid", "inline-grid"]);
const INLINE_LAYOUT_CLASSES = new Set(["inline-flex", "inline-grid"]);
const INLINE_CONTAINERS = new Set(["a", "p", "h1", "h2", "h3", "h4", "h5", "h6", "summary", "label", "th", "td"]);
const LIST_CONTAINERS = new Set(["ul", "ol", "dl", "table", "thead", "tbody", "tfoot", "tr"]);
const STRUCTURAL_TAGS = new Set(["li", "dt", "dd", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "summary"]);
// Line breaks that CSS keeps, as in the example alert on the home page.
const PRESERVED_BREAK_CLASSES = new Set(["whitespace-pre", "whitespace-pre-line", "whitespace-pre-wrap"]);

type HastChild = HastElement["children"][number];

const isLayoutContainer = (element: HastElement) =>
  !LIST_CONTAINERS.has(element.tagName) &&
  classNames(element).some(name => LAYOUT_CLASSES.has(name)) &&
  element.children.filter(child => child.type === "element").length > 1;

const asBlock = (child: HastChild): HastChild =>
  child.type !== "element" || STRUCTURAL_TAGS.has(child.tagName)
    ? child
    : { type: "element", tagName: "div", properties: {}, children: [child] };

const textNode = (value: string): HastChild => ({ type: "text", value });
const lineBreak = (): HastChild => ({ type: "element", tagName: "br", properties: {}, children: [] });

const spaced = (children: HastChild[]) =>
  children.flatMap((child, index) => (index === 0 ? [child] : [textNode(" "), child]));

/** Each run of line breaks in the text becomes one <br>. */
const withBreaks = (children: HastChild[]) =>
  children.flatMap(child =>
    child.type !== "text"
      ? [child]
      : child.value
          .split(/\s*\n\s*/)
          .flatMap((line, index) => [...(index > 0 ? [lineBreak()] : []), ...(line ? [textNode(line)] : [])]),
  );

/**
 * Drops what isn't content (React's <!-- --> text separators included), sets flex and grid items apart and keeps line
 * breaks that CSS shows. `inline` is true inside an element that takes only inline content.
 */
const prune = (element: HastElement, inline = false) => {
  element.children = element.children.filter(
    child => child.type !== "comment" && (child.type !== "element" || !isDropped(child)),
  );
  const inlineContent = inline || INLINE_CONTAINERS.has(element.tagName);
  for (const child of element.children) if (child.type === "element") prune(child, inlineContent);
  const names = classNames(element);
  if (names.some(name => PRESERVED_BREAK_CLASSES.has(name))) element.children = withBreaks(element.children);
  if (!isLayoutContainer(element)) return;
  element.children =
    inlineContent || names.some(name => INLINE_LAYOUT_CLASSES.has(name))
      ? spaced(element.children)
      : element.children.map(asBlock);
};

/** Links and images point at the live site, so the markdown works without the page it came from. */
const absolutizeUrls = (node: MdastNode, base: string) => {
  if ("url" in node && typeof node.url === "string") node.url = new URL(node.url, base).toString();
  if ("children" in node) for (const child of node.children) absolutizeUrls(child, base);
};

const text = (element: HastElement | undefined) =>
  element?.children
    .flatMap(child => (child.type === "text" ? [child.value] : []))
    .join("")
    .trim();

/** YAML front matter; JSON strings are valid YAML double-quoted scalars, so titles with colons stay intact. */
const frontMatter = (fields: Record<string, string | undefined>) =>
  [
    "---",
    ...Object.entries(fields).flatMap(([key, value]) => (value ? [`${key}: ${JSON.stringify(value)}`] : [])),
    "---",
  ].join("\n");

/**
 * The page as markdown: front matter with its title, description, canonical URL and language, then the content of
 * its <main> with GFM tables and absolute links. `url` is the page's canonical URL. Undefined when the HTML has no
 * <main>.
 */
export const htmlToMarkdown = (html: string, url: string): string | undefined => {
  const tree = fromHtml(html);
  const main = findElement(tree, ({ tagName }) => tagName === "main");
  if (!main) return undefined;

  prune(main);
  const content = toMdast(main);
  absolutizeUrls(content, url);
  const body = toMarkdown(content, {
    extensions: [gfmToMarkdown()],
    bullet: "-",
    listItemIndent: "one",
    rule: "-",
  });

  const description = findElement(
    tree,
    ({ tagName, properties }) => tagName === "meta" && properties.name === "description",
  );
  return `${frontMatter({
    title: text(findElement(tree, ({ tagName }) => tagName === "title")),
    description: description && String(description.properties.content ?? ""),
    url,
    language: String(findElement(tree, ({ tagName }) => tagName === "html")?.properties.lang ?? ""),
  })}\n\n${body}`;
};
