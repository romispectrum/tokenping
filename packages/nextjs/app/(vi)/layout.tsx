import type { ReactNode } from "react";
import { ROOT_VIEWPORT, rootDocument } from "~~/components/RootDocument";
import { VIETNAMESE_FONT_CLASSES } from "~~/components/fonts/vietnamese";
import { rootMetadata } from "~~/utils/seo";

export const metadata = rootMetadata("vi");
export const viewport = ROOT_VIEWPORT;

const RootLayout = ({ children }: { children: ReactNode }) =>
  rootDocument({ locale: "vi", children, fontClassName: VIETNAMESE_FONT_CLASSES });

export default RootLayout;
