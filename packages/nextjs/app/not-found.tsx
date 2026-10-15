import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "~~/components/home/marketingLayout";
import { GrainCard } from "~~/components/ui/GrainCard";
import { Kicker } from "~~/components/ui/Kicker";
import { buttonClasses } from "~~/components/ui/buttonClasses";

// Next adds the noindex robots tag to every 404 itself.
export const metadata: Metadata = {
  title: "Page not found",
};

// Verb first, naming the destination.
const NOT_FOUND_LINKS = [
  { href: "/", label: "Go to the home page" },
  { href: "/aave", label: "Open the dashboard" },
  { href: "/blog", label: "Read the blog" },
];

/**
 * The 404 on the marketing surface: the lavender wash and one grain card. The kicker carries the code, the h1 says
 * what happened, and the home page link is the view's one pink action.
 */
const NotFound = () => (
  <section
    aria-labelledby="not-found-title"
    className="flex flex-1 items-center bg-linear-to-b from-accent/70 via-background to-background py-16 md:py-24 dark:from-accent/40"
  >
    <Container>
      <GrainCard className="mx-auto max-w-2xl px-6 py-10 text-center sm:px-10 md:py-14">
        <Kicker>Error 404</Kicker>
        <h1 id="not-found-title" className="text-section my-0 text-balance">
          Page not found
        </h1>
        <p className="text-lead mx-auto mt-4 mb-0 max-w-[48ch] text-pretty text-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <nav aria-label="Pages" className="mt-8">
          <ul className="m-0 flex list-none flex-col items-center gap-3 p-0 sm:flex-row sm:flex-wrap sm:justify-center">
            {NOT_FOUND_LINKS.map(({ href, label }, index) => (
              <li key={href} className="m-0 w-full max-w-sm p-0 sm:w-auto">
                <Link
                  href={href}
                  className={buttonClasses({
                    variant: index === 0 ? "default" : "outline",
                    size: "lg",
                    className: "w-full sm:w-auto sm:min-w-32",
                  })}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </GrainCard>
    </Container>
  </section>
);

export default NotFound;
