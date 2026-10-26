import { MorphoDashboard } from "~~/components/dashboard/MorphoDashboard";
import { Container } from "~~/components/home/marketingLayout";
import { MORPHO_CHAINS } from "~~/config/morpho";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { joinList } from "~~/i18n/format";
import type { Locale } from "~~/i18n/locales";
import { MORPHO_MESSAGES } from "~~/i18n/messages/morpho";
import { routeAlternates } from "~~/i18n/routes";
import { formatAlertChannelsIn } from "~~/services/marketing/alertChannels";
import { pageMetadata } from "~~/utils/seo";

export const morphoMetadata = (locale: Locale) => {
  const { page } = MORPHO_MESSAGES[locale];
  return pageMetadata({
    title: page.metaTitle,
    description: page.metaDescription(MORPHO_CHAINS.length, formatAlertChannelsIn(locale, "disjunction")),
    locale,
    alternates: routeAlternates("morpho"),
  });
};

/**
 * The Morpho dashboard page of one language; app/(en)/morpho/page.tsx and app/(cs)/cz/morpho/page.tsx render it. A
 * server shell like /aave: the heading and the explanation are in the initial HTML, and only the wallet-dependent
 * dashboard is a client island.
 */
export const MorphoPage = ({ locale }: { locale: Locale }) => {
  const { page } = MORPHO_MESSAGES[locale];
  return (
    <Container className="flex flex-col gap-6 pt-6 pb-12 md:pt-8 md:pb-16">
      <header className="grid lg:grid-cols-12 lg:items-start lg:gap-x-6">
        <h1 className="m-0 text-2xl font-medium tracking-tight text-foreground lg:col-span-5">{page.title}</h1>
        <div className="mt-3 flex max-w-prose flex-col gap-2 text-sm text-muted-foreground lg:col-span-7 lg:mt-0">
          <p className="m-0">
            {page.intro(
              joinList(
                locale,
                MORPHO_CHAINS.map(({ name }) => name),
              ),
            )}
          </p>
          <p className="m-0">{page.checks(NOTIFICATION_CHECK_INTERVAL_MINUTES)}</p>
          <p className="m-0">{page.access}</p>
          <p className="m-0">{page.notAffiliated}</p>
        </div>
      </header>

      <MorphoDashboard />
    </Container>
  );
};
