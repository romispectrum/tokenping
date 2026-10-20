import { describe, expect, it } from "vitest";
import { acceptsMarkdown, estimateTokens, htmlToMarkdown } from "~~/utils/markdown";

const PAGE_URL = "https://tokenping.xyz/blog/guide";

/** A page document as the site renders it: the shared header and footer around the page's <main>. */
const page = (main: string, head = "<title>Guide | Tokenping</title>") =>
  `<!DOCTYPE html><html lang="en"><head>${head}</head><body>` +
  `<header><nav><a href="/">Tokenping</a><a href="/aave">Dashboard</a></nav></header>` +
  `<main id="main">${main}</main>` +
  `<footer><a href="/privacy">Privacy</a></footer></body></html>`;

/** The markdown after the front matter, which ends at the second "---" line. */
const body = (main: string) => htmlToMarkdown(page(main), PAGE_URL)?.split(/^---$/m).slice(2).join("---").slice(2);

describe("htmlToMarkdown", () => {
  it("converts <main> to markdown with front matter, a GFM table and absolute links", () => {
    const html = page(
      [
        "<h1>Health factor guide</h1>",
        '<p>Open <a href="/aave">the dashboard</a> or read <a href="#table">the table</a>.</p>',
        '<table id="table"><thead><tr><th>Health factor</th><th>Fall</th></tr></thead>',
        "<tbody><tr><td>1.5</td><td>9.6%</td></tr><tr><td>1.3</td><td>21.7%</td></tr></tbody></table>",
      ].join(""),
      '<title>Guide: alerts | Tokenping</title><meta name="description" content="What &quot;safe&quot; means.">',
    );

    expect(htmlToMarkdown(html, PAGE_URL)).toBe(
      [
        "---",
        'title: "Guide: alerts | Tokenping"',
        'description: "What \\"safe\\" means."',
        `url: "${PAGE_URL}"`,
        'language: "en"',
        "---",
        "",
        "# Health factor guide",
        "",
        `Open [the dashboard](https://tokenping.xyz/aave) or read [the table](${PAGE_URL}#table).`,
        "",
        "| Health factor | Fall  |",
        "| ------------- | ----- |",
        "| 1.5           | 9.6%  |",
        "| 1.3           | 21.7% |",
        "",
      ].join("\n"),
    );
  });

  it("leaves out the header and footer around <main>", () => {
    const markdown = htmlToMarkdown(page("<p>Body</p>"), PAGE_URL);

    expect(markdown).toContain("Body");
    expect(markdown).not.toContain("Dashboard");
    expect(markdown).not.toContain("Privacy");
  });

  it("leaves out empty front matter fields", () => {
    const html = "<html><head><title>Guide</title></head><body><main><p>Body</p></main></body></html>";

    expect(htmlToMarkdown(html, PAGE_URL)).toBe(`---\ntitle: "Guide"\nurl: "${PAGE_URL}"\n---\n\nBody\n`);
  });

  it("is undefined for a page without <main>", () => {
    expect(htmlToMarkdown("<html><body><p>Body</p></body></html>", PAGE_URL)).toBeUndefined();
  });

  it("drops scripts, icons, controls, hidden elements and images without alt text", () => {
    expect(
      body(
        [
          '<script type="application/ld+json">{"@type":"BlogPosting"}</script>',
          '<p><span aria-hidden="true">★</span>Rated <svg><text>icon</text></svg>five<span hidden> secret</span>.</p>',
          '<button type="button">Copy link</button><input value="0x1">',
          '<img alt="" src="/divider.png"><img alt="Alert email" src="/alert.png">',
        ].join(""),
      ),
    ).toBe("Rated five.\n\n![Alert email](https://tokenping.xyz/alert.png)\n");
  });

  it("drops forms, live regions and what a desktop browser hides", () => {
    expect(
      body(
        [
          '<form><label>Amount supplied<input name="amount"></label></form>',
          "<h4>Result</h4>",
          '<p role="status" class="sr-only">Health factor: 1.66.</p><p aria-live="polite">Loading</p>',
          "<p>Health factor 1.66</p>",
          '<p class="sr-only">For screen readers</p>',
          '<p class="mt-2 text-sm md:hidden">Scroll sideways to see every column.</p>',
          '<p class="hidden">Toggled by a script</p><p class="hidden sm:block">Shown from sm up</p>',
        ].join(""),
      ),
    ).toBe("#### Result\n\nHealth factor 1.66\n\nFor screen readers\n\nShown from sm up\n");
  });

  it("keeps the line breaks that whitespace-pre-line shows", () => {
    expect(body('<blockquote class="whitespace-pre-line">Below 1.5.\n\nSent at: 03:05</blockquote>')).toBe(
      "> Below 1.5.\\\n> Sent at: 03:05\n",
    );
  });

  it("drops React's <!-- --> text separators", () => {
    expect(body("<p>Below <!-- -->1.5<!-- --> now</p>")).toBe("Below 1.5 now\n");
  });

  it("puts each flex or grid item in its own block, as the page lays them out", () => {
    expect(
      body(
        '<ul class="grid gap-3"><li class="flex gap-3"><span class="flex flex-col">' +
          "<span>Prices drop</span><span>ETH falls.</span></span></li></ul>" +
          '<div class="flex gap-2"><a href="/aave">Open the dashboard</a><a href="/blog">Read the guides</a></div>',
      ),
    ).toBe(
      [
        "- Prices drop",
        "",
        "  ETH falls.",
        "",
        "[Open the dashboard](https://tokenping.xyz/aave)",
        "",
        "[Read the guides](https://tokenping.xyz/blog)",
        "",
      ].join("\n"),
    );
  });

  it("separates flex items with a space inside an element that only takes inline content", () => {
    expect(
      body(
        '<p class="flex flex-wrap gap-x-2"><span>By the team</span><span aria-hidden="true">·</span>' +
          "<span>Published <time>14 October 2026</time></span></p>",
      ),
    ).toBe("By the team Published 14 October 2026\n");
  });

  it("separates the items of an inline-flex box, or of a flex box inside a paragraph, with a space", () => {
    expect(
      body(
        '<p>Pay <span class="flex gap-1"><img alt="USDC" src="/usdc.png"><span>USDC</span></span> now</p>' +
          '<div><span class="inline-flex gap-1"><span>3 USDC</span><span>per 30 days</span></span></div>',
      ),
    ).toBe("Pay ![USDC](https://tokenping.xyz/usdc.png) USDC now\n\n3 USDC per 30 days\n");
  });

  it("keeps a definition list whose terms are grouped in flex <div>s", () => {
    expect(
      body(
        '<dl class="flex flex-col"><div class="flex"><dt>Alerts</dt><dd>3 USDC per 30 days</dd></div>' +
          '<div class="flex"><dt>Renewal</dt><dd>None automatic</dd></div></dl>',
      ),
    ).toBe("- Alerts\n\n  3 USDC per 30 days\n\n- Renewal\n\n  None automatic\n");
  });

  it("keeps the page's language", () => {
    const html = page("<p>Text</p>").replace('lang="en"', 'lang="cs"');

    expect(htmlToMarkdown(html, "https://tokenping.xyz/cz")).toContain('language: "cs"');
  });
});

describe("acceptsMarkdown", () => {
  it.each([
    ["text/markdown", true],
    ["text/markdown; charset=utf-8", true],
    ["text/markdown, text/html;q=0.9, */*;q=0.8", true],
    ["text/html, text/markdown;q=0.5", true],
    ["text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8", false],
    ["*/*", false],
    ["text/plain", false],
    ["", false],
    [null, false],
  ])("%j → %s", (accept, expected) => {
    expect(acceptsMarkdown(accept)).toBe(expected);
  });
});

describe("estimateTokens", () => {
  it("counts about four characters per token, rounding up", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("abcde")).toBe(2);
  });
});
