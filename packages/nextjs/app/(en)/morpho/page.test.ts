import { afterEach, describe, expect, it, vi } from "vitest";
import CzechMorpho, { generateMetadata as czechMetadata } from "~~/app/(cs)/cz/morpho/page";
import Morpho, { generateMetadata } from "~~/app/(en)/morpho/page";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("~~/components/pages/MorphoPage", () => ({
  MorphoPage: ({ locale }: { locale: string }) => `morpho page ${locale}`,
  morphoMetadata: (locale: string) => ({ title: `Morpho ${locale}` }),
}));

afterEach(() => vi.unstubAllEnvs());

describe("the /morpho and /cz/morpho routes", () => {
  it("answer 404, with not-found metadata, until Morpho is enabled", () => {
    for (const value of [undefined, "", "false", "1", "TRUE"]) {
      vi.stubEnv("NEXT_PUBLIC_MORPHO_ENABLED", value);
      expect(() => Morpho()).toThrow("NEXT_NOT_FOUND");
      expect(() => CzechMorpho()).toThrow("NEXT_NOT_FOUND");
      expect(generateMetadata().title).toMatchObject({ default: "Page not found" });
      expect(czechMetadata().title).toMatchObject({ default: "Page not found" });
    }
  });

  it("render the page in their language once it is", () => {
    vi.stubEnv("NEXT_PUBLIC_MORPHO_ENABLED", "true");
    expect(Morpho()).toBe("morpho page en");
    expect(CzechMorpho()).toBe("morpho page cs");
    expect(generateMetadata()).toEqual({ title: "Morpho en" });
    expect(czechMetadata()).toEqual({ title: "Morpho cs" });
  });
});
