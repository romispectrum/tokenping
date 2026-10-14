import type { ReactNode } from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";

// renderToString (unlike renderToStaticMarkup) keeps the <!-- --> separators between adjacent text nodes, so the
// assertions also pin how text is split in the server HTML.
export const renderHtml = (node: ReactNode) => renderToString(node);

// One tag per line keeps snapshot diffs readable; it only inserts newlines between adjacent tags.
export const renderMarkup = (node: ReactNode) => renderHtml(node).replace(/></g, ">\n<");

export const renderStaticMarkup = (node: ReactNode) => renderToStaticMarkup(node);
