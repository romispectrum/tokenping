import type { ReactNode } from "react";
import { ROOT_VIEWPORT, rootDocument } from "~~/components/RootDocument";
import { LocaleRoot } from "~~/i18n/client/sv";
import { rootMetadata } from "~~/utils/seo";

export const metadata = rootMetadata("sv");
export const viewport = ROOT_VIEWPORT;

const RootLayout = ({ children }: { children: ReactNode }) => rootDocument({ locale: "sv", LocaleRoot, children });

export default RootLayout;
