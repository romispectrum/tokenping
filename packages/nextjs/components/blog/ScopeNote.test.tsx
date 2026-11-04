import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ScopeNote } from "~~/components/blog/ScopeNote";

const text = (html: string) => html.replace(/<[^>]+>/g, "");

describe("ScopeNote", () => {
  it("ends the line with one full stop after the figures date", () => {
    expect(text(renderToStaticMarkup(<ScopeNote />))).toMatch(/14 Oct 2026\.$/);
    expect(text(renderToStaticMarkup(<ScopeNote locale="de" />))).toMatch(/14\. Okt\. 2026\.$/);
  });

  it("adds no second full stop after a date that already ends in one, as Hungarian dates do", () => {
    const line = text(renderToStaticMarkup(<ScopeNote locale="hu" protocol="morpho" />));
    expect(line).toMatch(/2026\. okt\. 26\.$/);
    expect(line).not.toContain("..");
  });
});
