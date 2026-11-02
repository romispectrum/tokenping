import type { ReactNode } from "react";
import { ROOT_VIEWPORT, rootDocument } from "~~/components/RootDocument";
import { LocaleRoot } from "~~/i18n/client/pt";
import { rootMetadata } from "~~/utils/seo";

export const metadata = rootMetadata("pt");
export const viewport = ROOT_VIEWPORT;

const RootLayout = ({ children }: { children: ReactNode }) => rootDocument({ locale: "pt", LocaleRoot, children });

export default RootLayout;
