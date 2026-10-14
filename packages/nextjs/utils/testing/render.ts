import type { ReactNode } from "react";
import { createRequire } from "node:module";

// @types/react-dom is not installed, so load the server renderer untyped and declare the functions used. Loading it
// natively also keeps it out of reach of a test's `vi.mock("react")`.
const { renderToString, renderToStaticMarkup } = createRequire(import.meta.url)("react-dom/server") as {
  renderToString: (node: ReactNode) => string;
  renderToStaticMarkup: (node: ReactNode) => string;
};

// renderToString (unlike renderToStaticMarkup) keeps the <!-- --> separators between adjacent text nodes, so the
// assertions also pin how text is split in the server HTML.
export const renderHtml = (node: ReactNode) => renderToString(node);

// One tag per line keeps snapshot diffs readable; it only inserts newlines between adjacent tags.
export const renderMarkup = (node: ReactNode) => renderHtml(node).replace(/></g, ">\n<");

export const renderStaticMarkup = (node: ReactNode) => renderToStaticMarkup(node);
