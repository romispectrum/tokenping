import type { ReactNode } from "react";
import { ROOT_VIEWPORT, rootDocument } from "~~/components/RootDocument";
import { LocaleRoot } from "~~/i18n/client/tr";
import { rootMetadata } from "~~/utils/seo";

export const metadata = rootMetadata("tr");
export const viewport = ROOT_VIEWPORT;

const RootLayout = ({ children }: { children: ReactNode }) => rootDocument({ locale: "tr", LocaleRoot, children });

export default RootLayout;
