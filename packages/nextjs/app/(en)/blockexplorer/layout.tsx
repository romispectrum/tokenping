import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DEV_ROUTE_NOT_FOUND_METADATA, areDevRoutesEnabled } from "~~/utils/devRoutes";
import { TITLE_TEMPLATE } from "~~/utils/seo";

export const generateMetadata = (): Metadata =>
  areDevRoutesEnabled()
    ? {
        // A plain string title here would end the root title template for the explorer pages below.
        title: { default: "Block Explorer", template: TITLE_TEMPLATE },
        description: "Explore blocks, transactions and addresses on the local development chain.",
      }
    : DEV_ROUTE_NOT_FOUND_METADATA;

/**
 * Gates /blockexplorer itself. Next renders a layout and its page in parallel, so the address and transaction pages
 * check the same gate before doing any work of their own.
 */
const BlockExplorerLayout = ({ children }: { children: ReactNode }) => {
  if (!areDevRoutesEnabled()) notFound();
  return <>{children}</>;
};

export default BlockExplorerLayout;
