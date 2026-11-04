import type { ReactNode } from "react";
import { ROOT_VIEWPORT, rootDocument } from "~~/components/RootDocument";
import { LocaleRoot } from "~~/i18n/client/da";
import { rootMetadata } from "~~/utils/seo";

export const metadata = rootMetadata("da");
export const viewport = ROOT_VIEWPORT;

const RootLayout = ({ children }: { children: ReactNode }) => rootDocument({ locale: "da", LocaleRoot, children });

export default RootLayout;
