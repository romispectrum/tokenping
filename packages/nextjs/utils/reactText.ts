import { type ReactNode, isValidElement } from "react";

/**
 * The text a React node renders, as the DOM's textContent reads it: its strings and numbers in order, through arrays,
 * fragments and elements (a link's text is its children). For copy built with JSX, such as the homepage answers, so
 * the JSON-LD can repeat the words the page shows without rendering it.
 */
export const reactNodeText = (node: ReactNode): string => {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") return String(node);
  if (Array.isArray(node)) return node.map(reactNodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return reactNodeText(node.props.children);
  return "";
};
