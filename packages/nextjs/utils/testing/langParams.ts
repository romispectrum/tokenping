/** The props Next passes a page under app/(intl)/[lang] for one language's first URL segment ("cz", "de"). */
export const langParams = <Extra extends Record<string, string>>(lang: string, extra?: Extra) => ({
  params: Promise.resolve({ lang, ...extra } as { lang: string } & Extra),
});
