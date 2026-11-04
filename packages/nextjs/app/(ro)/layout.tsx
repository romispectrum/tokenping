import type { ReactNode } from "react";
import { ROOT_VIEWPORT, rootDocument } from "~~/components/RootDocument";
import { LocaleRoot } from "~~/i18n/client/ro";
import { rootMetadata } from "~~/utils/seo";

export const metadata = rootMetadata("ro");
export const viewport = ROOT_VIEWPORT;

const RootLayout = ({ children }: { children: ReactNode }) => rootDocument({ locale: "ro", LocaleRoot, children });

export default RootLayout;
