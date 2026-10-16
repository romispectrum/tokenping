import type { ReactNode } from "react";
import Link from "next/link";
import { formatPostDate } from "~~/components/blog/formatPostDate";
import { Container } from "~~/components/home/marketingLayout";
import { Breadcrumbs } from "~~/components/seo/Breadcrumbs";
import { JsonLd } from "~~/components/seo/JsonLd";
import { EXTERNAL_LINK_REL, SOCIAL_LINKS } from "~~/constants/links";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import type { Locale } from "~~/i18n/locales";
import { PRIVACY_MESSAGES } from "~~/i18n/messages/privacy";
import { routeAlternates, routePath } from "~~/i18n/routes";
import { getAlertChannelNames } from "~~/services/marketing/alertChannels";
import { getPaymentChainName } from "~~/services/marketing/paymentChain";
import { type Crumb, breadcrumbJsonLd, pageMetadata, toIsoDateTime } from "~~/utils/seo";

export const privacyMetadata = (locale: Locale) =>
  pageMetadata({
    title: PRIVACY_MESSAGES[locale].metaTitle,
    description: PRIVACY_MESSAGES[locale].metaDescription,
    locale,
    alternates: routeAlternates("privacy"),
  });

/** Change only when the content below changes. */
const LAST_UPDATED = "2026-10-14";

const crumbs = (locale: Locale): Crumb[] => [
  { name: PRIVACY_MESSAGES[locale].crumbHome, path: routePath(locale, "home") },
  { name: PRIVACY_MESSAGES[locale].crumbPrivacy },
];

const TEXT_CLASS_NAME = "m-0";
const LIST_CLASS_NAME = "m-0 list-disc space-y-2 pl-6 marker:text-muted-foreground";

type PolicySectionProps = {
  title: string;
  children: ReactNode;
};

/** One h2 and its content, 16px apart; the sections sit 40px apart. */
const PolicySection = ({ title, children }: PolicySectionProps) => (
  <section className="grid gap-4">
    <h2 className="m-0 text-2xl">{title}</h2>
    {children}
  </section>
);

/**
 * Plain-language data page, written from the code (marketing product facts §7, §10.9). It must not call the product
 * "private" or "secure": settings are tied to a wallet address without a wallet-ownership check yet, so the config
 * and Telegram link reads answer anyone who sends an address, and writes only check that address's paid access.
 */
/** The privacy page of one language; app/(en)/privacy and app/(cs)/cs/ochrana-soukromi render it. */
export const PrivacyPage = ({ locale }: { locale: Locale }) => {
  const t = PRIVACY_MESSAGES[locale];
  const CRUMBS = crumbs(locale);
  const hasTelegram = getAlertChannelNames().includes("Telegram");
  const processors = t.processors.list({ minutes: NOTIFICATION_CHECK_INTERVAL_MINUTES, hasTelegram });

  return (
    <div className="relative isolate flex-1">
      {/* The lavender wash behind the page header, fading into the page colour before the policy text. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-96 bg-linear-to-b from-accent/70 to-background dark:from-accent/40"
      />
      <Container className="pt-8 pb-20 md:pt-12 md:pb-24">
        <div className="mx-auto max-w-[72ch]">
          <Breadcrumbs crumbs={CRUMBS} locale={locale} />
          <article>
            <header className="mb-10">
              <h1 className="text-section m-0 text-balance">{t.title}</h1>
              <p className="mt-3 mb-0 text-sm text-muted-foreground">
                {`${t.lastUpdated} `}
                <time dateTime={toIsoDateTime(LAST_UPDATED)}>{formatPostDate(LAST_UPDATED, locale)}</time>
              </p>
            </header>

            <div className="grid gap-10 leading-[1.75]">
              <p className={TEXT_CLASS_NAME}>{t.intro}</p>

              <PolicySection title={t.withoutUs.title}>
                <p className={TEXT_CLASS_NAME}>{t.withoutUs.text}</p>
              </PolicySection>

              <PolicySection title={t.stored.title}>
                <ul className={LIST_CLASS_NAME}>
                  {t.stored.items.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {hasTelegram && <p className={TEXT_CLASS_NAME}>{t.stored.telegram}</p>}
                <p className={TEXT_CLASS_NAME}>{t.stored.attribution}</p>
              </PolicySection>

              <PolicySection title={t.notStored.title}>
                <ul className={LIST_CLASS_NAME}>
                  {t.notStored.items.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </PolicySection>

              <PolicySection title={t.whoCanSee.title}>
                <p className={TEXT_CLASS_NAME}>{t.whoCanSee.tiedToWallet}</p>
                <p className={TEXT_CLASS_NAME}>{t.whoCanSee.anyone(hasTelegram)}</p>
                <p className={TEXT_CLASS_NAME}>{t.whoCanSee.dontEnter}</p>
              </PolicySection>

              <PolicySection title={t.processors.title}>
                {/* A list rather than a table: three columns of prose do not fit a phone without sideways scrolling. */}
                <dl className="m-0 grid gap-3">
                  {processors.map(({ name, role, receives }) => (
                    <div
                      key={name}
                      className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-card md:p-6"
                    >
                      <dt className="font-medium">{name}</dt>
                      <dd className="m-0 mt-1 text-muted-foreground">{role}</dd>
                      <dd className="m-0 mt-1 text-muted-foreground">{t.processors.receives(receives)}</dd>
                    </div>
                  ))}
                </dl>
                <p className={TEXT_CLASS_NAME}>{t.processors.ownPolicy}</p>
              </PolicySection>

              <PolicySection title={t.onChain.title}>
                <p className={TEXT_CLASS_NAME}>{t.onChain.text(getPaymentChainName())}</p>
              </PolicySection>

              <PolicySection title={t.retention.title}>
                <ul className={LIST_CLASS_NAME}>
                  <li>{t.retention.settings}</li>
                  {hasTelegram && <li>{t.retention.telegramStop}</li>}
                  <li>
                    {t.retention.contact.before}{" "}
                    <a href={SOCIAL_LINKS.x} rel={EXTERNAL_LINK_REL}>
                      {t.retention.contact.x}
                    </a>{" "}
                    {t.retention.contact.middle}{" "}
                    <a href={SOCIAL_LINKS.telegram} rel={EXTERNAL_LINK_REL}>
                      {t.retention.contact.telegram}
                    </a>{" "}
                    {t.retention.contact.after}
                  </li>
                  <li>{t.retention.payments}</li>
                </ul>
              </PolicySection>

              <p className={TEXT_CLASS_NAME}>
                {t.homepage.before}
                <Link href={routePath(locale, "home")}>{t.homepage.link}</Link>
                {t.homepage.after}
              </p>
            </div>
          </article>
        </div>
      </Container>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
    </div>
  );
};
