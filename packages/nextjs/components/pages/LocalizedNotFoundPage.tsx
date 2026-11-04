"use client";

import { NotFoundMessage, NotFoundShell } from "~~/components/pages/NotFoundView";
import { useLocale, useMessages } from "~~/i18n/LocaleProvider";

/**
 * The 404 of a prefixed language (app/(intl)/[lang]/not-found.tsx). Next gives a not-found file no params, so it reads
 * the language from the client root its layout mounted, and the strings from that language's messages.
 */
export const LocalizedNotFoundPage = () => {
  const locale = useLocale();
  const t = useMessages("common").notFound;
  return (
    <NotFoundShell>
      <NotFoundMessage locale={locale} t={t} headingId="not-found-title" />
    </NotFoundShell>
  );
};
