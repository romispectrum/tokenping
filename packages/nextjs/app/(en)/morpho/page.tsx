import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MorphoPage, morphoMetadata } from "~~/components/pages/MorphoPage";
import { isMorphoEnabled } from "~~/config/morpho";
import { DEV_ROUTE_NOT_FOUND_METADATA } from "~~/utils/devRoutes";

// A 404 until Morpho is enabled (NEXT_PUBLIC_MORPHO_ENABLED), like the developer pages outside hardhat builds.
export const generateMetadata = (): Metadata =>
  isMorphoEnabled() ? morphoMetadata("en") : DEV_ROUTE_NOT_FOUND_METADATA;

const Morpho = () => {
  if (!isMorphoEnabled()) notFound();
  return MorphoPage({ locale: "en" });
};

export default Morpho;
