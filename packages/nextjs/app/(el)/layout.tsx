import type { ReactNode } from "react";
import { ROOT_VIEWPORT, rootDocument } from "~~/components/RootDocument";
import { CYRILLIC_GREEK_FONT_CLASSES } from "~~/components/fonts/cyrillicGreek";
import { LocaleRoot } from "~~/i18n/client/el";
import { rootMetadata } from "~~/utils/seo";

export const metadata = rootMetadata("el");
export const viewport = ROOT_VIEWPORT;

const RootLayout = ({ children }: { children: ReactNode }) =>
  rootDocument({ locale: "el", LocaleRoot, children, fontClassName: CYRILLIC_GREEK_FONT_CLASSES });

export default RootLayout;
