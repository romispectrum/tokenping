import type { ReactNode } from "react";
import { ROOT_VIEWPORT, rootDocument } from "~~/components/RootDocument";
import { rootMetadata } from "~~/utils/seo";

export const metadata = rootMetadata("hi");
export const viewport = ROOT_VIEWPORT;

const RootLayout = ({ children }: { children: ReactNode }) => rootDocument({ locale: "hi", children });

export default RootLayout;
