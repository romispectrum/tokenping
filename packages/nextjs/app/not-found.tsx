import Link from "next/link";
import type { Metadata } from "next";

// Next adds the noindex robots tag to every 404 itself.
export const metadata: Metadata = {
  title: "Page not found",
};

const NOT_FOUND_LINKS = [
  { href: "/", label: "Home" },
  { href: "/aave", label: "Dashboard" },
  { href: "/blog", label: "Blog" },
];

const NotFound = () => (
  <div className="flex items-center h-full flex-1 justify-center bg-base-200 px-4 py-16">
    <div className="text-center">
      <p className="text-6xl font-bold m-0 mb-1" aria-hidden>
        404
      </p>
      <h1 className="text-2xl font-semibold m-0">Page not found</h1>
      <p className="text-base-content/70 m-0 mb-4">The page you&apos;re looking for doesn&apos;t exist.</p>
      <nav aria-label="Pages">
        <ul className="flex flex-wrap justify-center gap-2 list-none p-0 m-0">
          {NOT_FOUND_LINKS.map(({ href, label }, index) => (
            <li key={href}>
              <Link href={href} className={`btn ${index === 0 ? "btn-primary" : "btn-ghost"}`}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  </div>
);

export default NotFound;
