import { getChannelBadgeNames, getHomeHeadline, getNetworkBadgeNames } from "~~/components/home/homeContent";
import { DashboardCta } from "~~/components/home/homeUi";
import { Container } from "~~/components/home/marketingLayout";
import { Badge } from "~~/components/ui/Badge";
import { Glow } from "~~/components/ui/Glow";
import { GrainCard } from "~~/components/ui/GrainCard";
import { Kicker } from "~~/components/ui/Kicker";
import { DEFAULT_HEALTH_FACTOR_THRESHOLD, NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { formatAlertChannels } from "~~/services/marketing/alertChannels";
import { buildAlertEmail, buildAlertText } from "~~/services/notifications/runNotificationCheck";
import { formatUtcTimestamp } from "~~/utils/format";

/** Illustrative values for the real alert template; the panel says they are examples. */
const EXAMPLE_ALERT = {
  chainName: "Arbitrum",
  healthFactor: "1.42",
  threshold: DEFAULT_HEALTH_FACTOR_THRESHOLD,
  timestamp: formatUtcTimestamp(new Date("2026-10-14T03:05:00Z")),
};

type BadgeRowProps = {
  label: string;
  names: readonly string[];
};

const BadgeRow = ({ label, names }: BadgeRowProps) => (
  <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
    <span className="text-sm font-medium text-foreground">{label}</span>
    <ul className="m-0 flex list-none flex-wrap justify-center gap-1.5 p-0 sm:gap-2 lg:justify-start">
      {names.map(name => (
        <li key={name} className="m-0 p-0">
          <Badge>{name}</Badge>
        </li>
      ))}
    </ul>
  </div>
);

/**
 * Product evidence allowed today (marketing plan §2.6): the exact message, built by the code that sends it. It is
 * the hero's visual, an opaque inner panel on the glass (never a nested card), so muted text is fine inside it.
 */
const ExampleAlert = () => (
  <figure
    aria-labelledby="example-alert-label"
    className="m-0 w-full rounded-xl border border-border bg-card p-5 text-left text-card-foreground"
  >
    <p id="example-alert-label" className="m-0 text-sm font-medium">
      What an alert says
    </p>
    {/* A message, not data: Satoshi, line breaks kept */}
    <blockquote className="m-0 mt-3 leading-relaxed whitespace-pre-line">{buildAlertText(EXAMPLE_ALERT)}</blockquote>
    <figcaption className="mt-3 text-sm text-muted-foreground">
      {`Example only: the network, numbers and time are made up. Emails arrive with the subject "${buildAlertEmail(EXAMPLE_ALERT).subject}".`}
    </figcaption>
  </figure>
);

/**
 * Eyebrow, headline A, subhead S2 and the primary action on the left; the example alert and the coverage badges on
 * the right from lg, under them before (marketing plan §2.1 to 2.2, §2.6, §2.7). On a phone the headline and the
 * primary action stay in the first screen, the panel follows the microcopy.
 *
 * Layers, back to front: the lavender wash, the glow anchored to the card's bottom-right corner (the page's first of
 * two, now behind the panel's corner), the grain glass card, then the content. Every text line directly on the
 * glass is text-foreground: the glow can tint the card behind it, and muted text over the tint drops below 4.5:1.
 * No mascot.
 */
export const HomeHero = () => (
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
              <Kicker>Aave V3 health factor alerts</Kicker>
              <h1 id="home-headline" className="text-display m-0 text-balance">
                {getHomeHeadline()}
              </h1>
              <p className="text-lead mx-auto mt-4 mb-0 max-w-[52ch] text-pretty text-foreground md:text-xl lg:mx-0">
                {`Read-only: no approvals on your Aave position and no minimum size. We check every ${NOTIFICATION_CHECK_INTERVAL_MINUTES} minutes and alert you by ${formatAlertChannels("or")} whenever your health factor is below the line you set.`}
              </p>
              <DashboardCta align="start" secondary={{ label: "See how it works", sectionId: "how-it-works" }} />
            </div>
            <div className="flex flex-col items-center gap-6 lg:items-start">
              <ExampleAlert />
              <div className="flex flex-col items-center gap-2 sm:gap-3 lg:items-start">
                <BadgeRow label="Networks:" names={getNetworkBadgeNames()} />
                <BadgeRow label="Alerts by:" names={getChannelBadgeNames()} />
                <p className="m-0 text-sm text-foreground">Aave V3 only. On Ethereum, the Core market.</p>
              </div>
            </div>
          </div>
        </GrainCard>
      </div>
    </Container>
  </section>
);
