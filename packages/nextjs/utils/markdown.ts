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

// Scripts (JSON-LD among them), styles and icons carry no prose, and neither do form controls.
const DROPPED_TAGS = new Set([
  ...["script", "style", "template", "noscript", "svg"],
  ...["button", "input", "select", "textarea"],
]);

/**
 * What a reader of the page would not get: hidden elements, anything hidden from assistive technology (decorative
 * icons and duplicates of visible text) and images without alt text.
 */
const isDropped = ({ tagName, properties }: HastElement) =>
  DROPPED_TAGS.has(tagName) ||
  properties.hidden !== undefined ||
  String(properties.ariaHidden) === "true" ||
  (tagName === "img" && !properties.alt);

// Flex and grid items are laid out apart, so two <span>s in a flex column read as two lines on screen but would run
// together as "Prices dropETH falls" in markdown. Each item gets its own block, or a space around it inside an element
// that takes only inline content (a byline <p>). Lists and tables keep their children, and list items, table parts and
// definition terms are never wrapped: the converter finds them by tag (a <dl> may group each term in a <div>).
const LAYOUT_CLASSES = new Set(["flex", "inline-flex", "grid", "inline-grid"]);
const INLINE_CONTAINERS = new Set(["a", "p", "h1", "h2", "h3", "h4", "h5", "h6", "summary", "label", "th", "td"]);
const LIST_CONTAINERS = new Set(["ul", "ol", "dl", "table", "thead", "tbody", "tfoot", "tr"]);
const STRUCTURAL_TAGS = new Set(["li", "dt", "dd", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "summary"]);

const isLayoutContainer = ({ tagName, properties, children }: HastElement) =>
  !LIST_CONTAINERS.has(tagName) &&
  Array.isArray(properties.className) &&
  properties.className.some(name => LAYOUT_CLASSES.has(String(name))) &&
  children.filter(child => child.type === "element").length > 1;

const asBlock = (child: HastElement["children"][number]): HastElement["children"][number] =>
  child.type !== "element" || STRUCTURAL_TAGS.has(child.tagName)
    ? child
    : { type: "element", tagName: "div", properties: {}, children: [child] };

/** Drops what isn't content (React's <!-- --> text separators included) and sets flex and grid items apart. */
const prune = (element: HastElement) => {
  element.children = element.children.filter(
    child => child.type !== "comment" && (child.type !== "element" || !isDropped(child)),
  );
  for (const child of element.children) if (child.type === "element") prune(child);
  if (!isLayoutContainer(element)) return;
  element.children = INLINE_CONTAINERS.has(element.tagName)
    ? element.children.flatMap((child, index) =>
        index === 0 ? [child] : [{ type: "text" as const, value: " " }, child],
      )
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
