import type { Metadata } from "next";
import type { Chain } from "viem";
import { hardhat } from "viem/chains";
import scaffoldConfig from "~~/scaffold.config";
import { TITLE_TEMPLATE } from "~~/utils/seo";

/**
 * The Scaffold-ETH dev routes (/debug, /blockexplorer) exist only in builds that target the local hardhat chain, the
 * same condition under which the header and footer link to them. Everywhere else they answer 404, rather than a
 * noindex page or a robots.txt Disallow, which would still leave the bare URLs indexable.
 */
export const areDevRoutesEnabled = (targetNetworks: readonly Chain[] = scaffoldConfig.targetNetworks) =>
  targetNetworks.some(({ id }) => id === hardhat.id);

/**
 * A dev route's metadata outside hardhat builds. Next still sends the route's own metadata to the browser with the
 * 404, so without this the 404 page would retitle itself "Debug Contracts" or "Block Explorer" once it hydrates. The
 * template keeps the site suffix on the not-found page below the /blockexplorer layout.
 */
export const DEV_ROUTE_NOT_FOUND_METADATA: Metadata = {
  title: { default: "Page not found", template: TITLE_TEMPLATE },
};
