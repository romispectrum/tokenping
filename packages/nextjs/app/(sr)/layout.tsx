import type { ReactNode } from "react";
import { ROOT_VIEWPORT, rootDocument } from "~~/components/RootDocument";
import { LocaleRoot } from "~~/i18n/client/sr";
import { rootMetadata } from "~~/utils/seo";

export const metadata = rootMetadata("sr");
export const viewport = ROOT_VIEWPORT;

const RootLayout = ({ children }: { children: ReactNode }) => rootDocument({ locale: "sr", LocaleRoot, children });

export default RootLayout;
