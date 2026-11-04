import { describe, expect, it } from "vitest";
import { metadata } from "~~/app/(en)/morpho/page";
import { generateMetadata as czechRouteMetadata } from "~~/app/(intl)/[lang]/morpho/page";
import { langParams } from "~~/utils/testing/langParams";

describe("the /morpho and /cz/morpho routes", () => {
  it("are static pages with their own metadata and each other as alternates", async () => {
    const czechMetadata = await czechRouteMetadata(langParams("cz"));
    expect(metadata.title).toEqual({ absolute: "Morpho health factor alerts for Blue and Midnight loans" });
    expect(metadata.alternates?.canonical).toBe("/morpho");
    expect(czechMetadata.alternates?.canonical).toBe("/cz/morpho");
    expect(czechMetadata.alternates?.languages).toMatchObject({ en: "/morpho", cs: "/cz/morpho" });
  });
});
