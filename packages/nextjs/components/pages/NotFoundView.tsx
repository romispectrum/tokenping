import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "~~/components/home/marketingLayout";
import { GrainCard } from "~~/components/ui/GrainCard";
import { Kicker } from "~~/components/ui/Kicker";
import { buttonClasses } from "~~/components/ui/buttonClasses";
import type { Locale } from "~~/i18n/locales";
import type { CommonMessages } from "~~/i18n/messages/common/shared";
import { routePath } from "~~/i18n/routes";

// The 404's markup, without message imports, so the server pages (NotFoundPage.tsx) and the client page of the
// prefixed languages (LocalizedNotFoundPage.tsx) share it and a client bundle carries no other language's strings.

type NotFoundMessages = CommonMessages["notFound"];

// Verb first, naming the destination.
const notFoundLinks = (locale: Locale, t: NotFoundMessages) => [
  { href: routePath(locale, "home"), label: t.home },
  { href: routePath(locale, "dashboard"), label: t.dashboard },
  { href: routePath(locale, "blog"), label: t.blog },
];

type NotFoundMessageProps = {
  locale: Locale;
  /** The language's 404 strings: from the server's message objects, or from the client root's on a client page. */
  t: NotFoundMessages;
  /** The id of the heading, which names the section. */
  headingId?: string;
};

/** The kicker with the code, the heading that says what happened, one sentence and the links, in one language. */
export const NotFoundMessage = ({ locale, t, headingId }: NotFoundMessageProps) => (
  <>
    <Kicker>{t.kicker}</Kicker>
    <h1 id={headingId} className="text-section my-0 text-balance">
      {t.title}
    </h1>
    <p className="text-lead mx-auto mt-4 mb-0 max-w-[48ch] text-pretty text-foreground">{t.text}</p>
    <nav aria-label={t.navLabel} className="mt-8">
      <ul className="m-0 flex list-none flex-col items-center gap-3 p-0 sm:flex-row sm:flex-wrap sm:justify-center">
        {notFoundLinks(locale, t).map(({ href, label }, index) => (
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
  </>
);

/** The marketing surface of the 404: the lavender wash and one grain card. */
export const NotFoundShell = ({ children }: { children: ReactNode }) => (
  <section
    aria-labelledby="not-found-title"
    className="flex flex-1 items-center bg-linear-to-b from-accent/70 via-background to-background py-16 md:py-24 dark:from-accent/40"
  >
    <Container>
      <GrainCard className="mx-auto max-w-2xl px-6 py-10 text-center sm:px-10 md:py-14">{children}</GrainCard>
    </Container>
  </section>
);
