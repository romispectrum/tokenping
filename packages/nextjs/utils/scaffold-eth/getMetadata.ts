import type { Metadata } from "next";

/**
 * Title and description for the Scaffold-ETH dev routes (/debug, /blockexplorer). The root layout's metadata
 * (utils/seo rootMetadata) supplies metadataBase, the title template, icons and the social card, so this no longer
 * sets the old localhost base URL, the "Built with Scaffold-ETH 2" thumbnail or the crane favicon. Site pages use
 * pageMetadata from utils/seo instead.
 */
export const getMetadata = ({ title, description }: { title: string; description: string }): Metadata => ({
  title,
  description,
});
