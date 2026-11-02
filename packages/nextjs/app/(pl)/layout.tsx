import type { ReactNode } from "react";
import { ROOT_VIEWPORT, rootDocument } from "~~/components/RootDocument";
import { LocaleRoot } from "~~/i18n/client/pl";
import { rootMetadata } from "~~/utils/seo";

export const metadata = rootMetadata("pl");
export const viewport = ROOT_VIEWPORT;

const RootLayout = ({ children }: { children: ReactNode }) => rootDocument({ locale: "pl", LocaleRoot, children });

export default RootLayout;
