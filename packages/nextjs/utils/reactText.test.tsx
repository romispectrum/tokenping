// @vitest-environment jsdom
import { Fragment, createElement } from "react";
import Link from "next/link";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { reactNodeText } from "~~/utils/reactText";

describe("reactNodeText", () => {
  it("reads strings and numbers in order through fragments, arrays and elements", () => {
    const node = createElement(
      Fragment,
      null,
      "Alerts cost ",
      3,
      " USDC. See the ",
      <Link key="link" href="/privacy">
        privacy page
      </Link>,
      ".",
    );

    expect(reactNodeText(node)).toBe("Alerts cost 3 USDC. See the privacy page.");
  });

  it("skips what renders nothing: null, undefined and booleans", () => {
    expect(reactNodeText([null, "a", undefined, false, true, ["b", null]])).toBe("ab");
  });

  it("matches the DOM's textContent of the same node", () => {
    const node = (
      <p>
        No. Tokenping only reads{" "}
        <a href="https://example.com">
          your <strong>positions</strong>
        </a>
        {null}, then stops.
      </p>
    );
    const { container } = render(node);

    expect(reactNodeText(node)).toBe(container.textContent);
  });
});
