import type { ReactNode } from "react";
import { ROOT_VIEWPORT, rootDocument } from "~~/components/RootDocument";
import { rootMetadata } from "~~/utils/seo";

export const metadata = rootMetadata("en");
export const viewport = ROOT_VIEWPORT;

const RootLayout = ({ children }: { children: ReactNode }) => rootDocument({ locale: "en", children });

export default RootLayout;
