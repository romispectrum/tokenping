import type { ReactNode } from "react";
import { pageMetadata } from "~~/utils/seo";

// A server layout, because the admin page itself is a client component and cannot export metadata. The owner checks
// happen on-chain; noindex only keeps the console out of search results (and it is left out of the sitemap).
export const metadata = pageMetadata({
  title: "Admin",
  description: "Owner console for the Tokenping payment contract.",
  path: "/admin",
  noIndex: true,
});

const AdminLayout = ({ children }: { children: ReactNode }) => <>{children}</>;

export default AdminLayout;
