import { type ReactNode, isValidElement } from "react";

/**
 * The anchor id of a heading: "Step 1: Connect your wallet" -> "step-1-connect-your-wallet". Latin letters lose their
 * accents ("Proč" -> "proc", "Größe" -> "grosse", "Đáo hạn" -> "dao-han"); other scripts keep their letters, vowel
 * signs and digits ("हेल्थ फ़ैक्टर क्या है?" -> "हेल्थ-फ़ैक्टर-क्या-है", "什么是健康因子？" -> "什么是健康因子"), so every
 * language's headings get ids. NFC after the accents go puts Korean syllables and Japanese voiced kana back together.
 */
export const headingId = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .normalize("NFC")
    .toLowerCase()
    // Letters NFKD does not split into a base and a mark: German "ß" and Vietnamese "đ".
    .replace(/ß/g, "ss")
    .replace(/đ/g, "d")
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, "")
    .trim()
    .replace(/[\s-]+/g, "-");

/** The text of rendered MDX children, e.g. a heading with inline code: ["What is ", <code>x</code>, "?"]. */
export const textContent = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textContent(node.props.children);
  return "";
};
