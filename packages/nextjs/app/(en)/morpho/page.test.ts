import { describe, expect, it } from "vitest";
import { metadata as czechMetadata } from "~~/app/(cs)/cz/morpho/page";
import { metadata } from "~~/app/(en)/morpho/page";

describe("the /morpho and /cz/morpho routes", () => {
  it("are static pages with their own metadata and each other as alternates", () => {
    expect(metadata.title).toEqual({ absolute: "Morpho health factor alerts for Blue and Midnight loans" });
    expect(metadata.alternates?.canonical).toBe("/morpho");
    expect(czechMetadata.alternates?.canonical).toBe("/cz/morpho");
    expect(czechMetadata.alternates?.languages).toMatchObject({ en: "/morpho", cs: "/cz/morpho" });
  });
});
