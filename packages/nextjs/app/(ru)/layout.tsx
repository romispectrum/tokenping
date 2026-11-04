import type { ReactNode } from "react";
import { ROOT_VIEWPORT, rootDocument } from "~~/components/RootDocument";
import { CYRILLIC_GREEK_FONT_CLASSES } from "~~/components/fonts/cyrillicGreek";
import { LocaleRoot } from "~~/i18n/client/ru";
import { rootMetadata } from "~~/utils/seo";

export const metadata = rootMetadata("ru");
export const viewport = ROOT_VIEWPORT;

const RootLayout = ({ children }: { children: ReactNode }) =>
  rootDocument({ locale: "ru", LocaleRoot, children, fontClassName: CYRILLIC_GREEK_FONT_CLASSES });

export default RootLayout;
