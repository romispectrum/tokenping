import { describe, expect, it } from "vitest";
import { BetaBanner } from "~~/components/BetaBanner";
import { renderMarkup } from "~~/utils/testing/render";

describe("BetaBanner", () => {
  it("renders the beta notice with the X link", () => {
    expect(renderMarkup(<BetaBanner />)).toMatchSnapshot();
  });

  it("claims the banner landmark", () => {
    // BUG(B4.1): the beta strip claims the page's banner landmark instead of the site header.
    expect(renderMarkup(<BetaBanner />)).toMatch(/^<div [^>]*role="banner"/);
  });

  it("opens the X account in a new tab without opener or referrer", () => {
    const [anchor] = renderMarkup(<BetaBanner />).match(/<a [^>]*>/) ?? [];

    expect(anchor).toContain('href="https://x.com/tokenping"');
    expect(anchor).toContain('target="_blank"');
    expect(anchor).toContain('rel="noopener noreferrer"');
    expect(anchor).toContain('aria-label="Follow Tokenping on X"');
  });
});
