import type { ReactNode } from "react";
import { ROOT_VIEWPORT, rootDocument } from "~~/components/RootDocument";
import { LocaleRoot } from "~~/i18n/client/hr";
import { rootMetadata } from "~~/utils/seo";

export const metadata = rootMetadata("hr");
export const viewport = ROOT_VIEWPORT;

const RootLayout = ({ children }: { children: ReactNode }) => rootDocument({ locale: "hr", LocaleRoot, children });

export default RootLayout;
