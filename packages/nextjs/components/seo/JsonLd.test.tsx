import { describe, expect, it } from "vitest";
import { JsonLd, serializeJsonLd } from "~~/components/seo/JsonLd";
import { renderStaticMarkup } from "~~/utils/testing/render";

describe("serializeJsonLd", () => {
  it("escapes <, > and & so a string value cannot close or alter the script element", () => {
    const data = { name: "</script><script>alert(1)</script>", note: "<!-- & -->" };
    const serialized = serializeJsonLd(data);

    expect(serialized).not.toMatch(/[<>&]/);
    expect(serialized).toBe(
      '{"name":"\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e","note":"\\u003c!-- \\u0026 --\\u003e"}',
    );
    // The escapes are plain JSON: parsing restores the original values.
    expect(JSON.parse(serialized)).toEqual(data);
  });
});

describe("JsonLd", () => {
  it("renders an application/ld+json script with the raw, escaped JSON (not entity-encoded)", () => {
    expect(renderStaticMarkup(<JsonLd data={{ "@type": "Thing", name: "A & B <C>" }} />)).toBe(
      '<script type="application/ld+json">{"@type":"Thing","name":"A \\u0026 B \\u003cC\\u003e"}</script>',
    );
  });
});
