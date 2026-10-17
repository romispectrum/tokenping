import { type LucideIcon, Mail, MessageCircle, Send } from "lucide-react";
import { NetworkIcon } from "~~/components/custom/aave/NetworkIcon";
import { getChannelBadgeNames, getHomeHeadline, getNetworkBadges } from "~~/components/home/homeContent";
import { DashboardCta } from "~~/components/home/homeUi";
import { Container } from "~~/components/home/marketingLayout";
import { Badge } from "~~/components/ui/Badge";
import { Glow } from "~~/components/ui/Glow";
import { GrainCard } from "~~/components/ui/GrainCard";
import { Kicker } from "~~/components/ui/Kicker";
import { AAVE_CHAINS, AAVE_MARKETS, AAVE_V4_SPOKES } from "~~/config/aaveConfig";
import { DEFAULT_HEALTH_FACTOR_THRESHOLD, NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import type { Locale } from "~~/i18n/locales";
import { HOME_MESSAGES } from "~~/i18n/messages/home";
import { formatAlertChannelsIn } from "~~/services/marketing/alertChannels";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { buildAlertEmail, buildAlertText } from "~~/services/notifications/runNotificationCheck";
import { formatUtcTimestamp } from "~~/utils/format";

/** Illustrative values for the real alert template, its time in the page's language; the panel says they are examples. */
const exampleAlert = (locale: Locale) => ({
  chainName: "Arbitrum",
  healthFactor: "1.42",
  threshold: DEFAULT_HEALTH_FACTOR_THRESHOLD,
  timestamp: formatUtcTimestamp(new Date("2026-10-14T03:05:00Z"), locale),
});

/** A glyph per channel, by the badge's name in either language; lucide has no brand marks, so these stand in. */
const CHANNEL_ICONS: Record<string, LucideIcon> = {
  signal: MessageCircle,
  telegram: Send,
  email: Mail,
  "e-mail": Mail,
};

/**
 * Every network Tokenping reads, as its logo (served by this site, like the token icons): the names are in the
 * coverage section, so the strip reads at a glance and names each one only for assistive tech and on hover.
 */
const NetworkLogoStrip = ({ locale }: { locale: Locale }) => {
  const t = HOME_MESSAGES[locale];
  return (
    <div className="flex flex-col items-center gap-2 lg:items-start">
      <ul
        aria-label={t.networksLabel}
        className="m-0 flex max-w-sm list-none flex-wrap justify-center gap-1.5 p-0 lg:justify-start"
      >
        {getNetworkBadges().map(({ chainId, name }) => (
          <li key={chainId} title={name} className="m-0 p-0">
            <NetworkIcon chainId={chainId} name={name} className="size-7" />
            <span className="sr-only">{name}</span>
          </li>
        ))}
      </ul>
      <p className="m-0 text-sm font-medium text-foreground">
        {t.heroCoverage({ networks: AAVE_CHAINS.length, markets: AAVE_MARKETS.length + AAVE_V4_SPOKES.length })}
      </p>
    </div>
  );
};

/** "Alerts by:" and a badge per channel, each with its glyph. */
const ChannelBadges = ({ locale }: { locale: Locale }) => (
  <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
    <span className="text-sm font-medium text-foreground">{HOME_MESSAGES[locale].channelsLabel}</span>
    <ul className="m-0 flex list-none flex-wrap justify-center gap-1.5 p-0 sm:gap-2 lg:justify-start">
      {getChannelBadgeNames(locale).map(name => {
        const Icon = CHANNEL_ICONS[name.toLowerCase()];
        return (
          <li key={name} className="m-0 p-0">
            <Badge>
              {Icon ? <Icon aria-hidden="true" /> : null}
              {name}
            </Badge>
          </li>
        );
      })}
    </ul>
  </div>
);

/**
 * Product evidence allowed today (marketing plan §2.6): the exact message, built by the code that sends it. It is
 * the hero's visual, an opaque inner panel on the glass (never a nested card), so muted text is fine inside it.
 */
const ExampleAlert = ({ locale }: { locale: Locale }) => {
  const t = HOME_MESSAGES[locale];
  const alert = exampleAlert(locale);
  return (
    <figure
      aria-labelledby="example-alert-label"
      className="m-0 w-full rounded-xl border border-border bg-card p-5 text-left text-card-foreground"
    >
      <p id="example-alert-label" className="m-0 text-sm font-medium">
        {t.exampleAlertLabel}
      </p>
      {/* A message, not data: Satoshi, line breaks kept */}
      <blockquote className="m-0 mt-3 leading-relaxed whitespace-pre-line">{buildAlertText(alert, locale)}</blockquote>
      <figcaption className="mt-3 text-sm text-muted-foreground">
        {t.exampleAlertCaption(buildAlertEmail(alert, locale).subject)}
      </figcaption>
    </figure>
  );
};

/**
 * Eyebrow, headline A, subhead S2 and the primary action on the left; the example alert, the network logos and the
 * channel badges on the right from lg, under them before (marketing plan §2.1 to 2.2, §2.6, §2.7). On a phone the
 * headline and the primary action stay in the first screen, the panel follows the microcopy.
 *
 * Layers, back to front: the lavender wash, the glow anchored to the card's bottom-right corner (the page's first of
 * two, now behind the panel's corner), the grain glass card, then the content. Every text line directly on the
 * glass is text-foreground: the glow can tint the card behind it, and muted text over the tint drops below 4.5:1.
 * No mascot.
 */
export const HomeHero = ({ locale, plan }: { locale: Locale; plan: AlertPlan | null }) => {
  const t = HOME_MESSAGES[locale];
  return (
    <section aria-labelledby="home-headline" className="relative isolate overflow-hidden pt-6 pb-16 md:pt-12 md:pb-24">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-linear-to-b from-accent/70 via-background to-background dark:from-accent/40"
      />
      <Container>
        <div className="relative rounded-3xl">
          <Glow placement="bottom-right" />
          <GrainCard className="px-6 py-10 sm:px-10 md:px-12 md:py-14 lg:px-16 lg:py-16">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12">
              <div className="text-center lg:text-left">
                <Kicker>{t.kicker}</Kicker>
                <h1 id="home-headline" className="text-display m-0 text-balance">
                  {getHomeHeadline(locale)}
                </h1>
                <p className="text-lead mx-auto mt-4 mb-0 max-w-[52ch] text-pretty text-foreground md:text-xl lg:mx-0">
                  {t.heroLead({
                    minutes: NOTIFICATION_CHECK_INTERVAL_MINUTES,
                    channels: formatAlertChannelsIn(locale, "disjunction"),
                  })}
                </p>
                <DashboardCta
                  locale={locale}
                  plan={plan}
                  align="start"
                  secondary={{ label: t.seeHowItWorks, sectionId: "how-it-works" }}
                />
              </div>
              <div className="flex flex-col items-center gap-6 lg:items-start">
                <ExampleAlert locale={locale} />
                <NetworkLogoStrip locale={locale} />
                <ChannelBadges locale={locale} />
              </div>
            </div>
          </GrainCard>
        </div>
      </Container>
    </section>
  );
};
