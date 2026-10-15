import { getChannelBadgeNames, getHomeHeadline, getNetworkBadgeNames } from "~~/components/home/homeContent";
import { DashboardCta } from "~~/components/home/homeUi";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { formatAlertChannels } from "~~/services/marketing/alertChannels";

type BadgeRowProps = {
  label: string;
  names: readonly string[];
};

const BadgeRow = ({ label, names }: BadgeRowProps) => (
  <div className="flex flex-wrap items-center justify-center gap-2">
    <span className="text-sm font-medium text-base-content/80 dark:text-gray-300">{label}</span>
    <ul className="m-0 flex list-none flex-wrap justify-center gap-2 p-0">
      {names.map(name => (
        <li key={name} className="m-0 p-0">
          <span className="badge badge-outline badge-md border-base-content/30 text-base-content dark:border-white/30">
            {name}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

/** Eyebrow, headline A, subhead S2, the primary action and the coverage badges (marketing plan §2.1–2.2, §2.7). */
export const HomeHero = () => (
  <section aria-labelledby="home-headline" className="pt-4 pb-2 text-center sm:pt-8">
    <p className="m-0 mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-700 dark:text-indigo-300">
      Aave V3 health factor alerts
    </p>
    <h1
      id="home-headline"
      className="m-0 mb-4 text-3xl font-bold leading-tight sm:text-5xl bg-gradient-to-r from-neutral via-indigo-800 to-indigo-600 bg-clip-text text-transparent dark:from-white dark:via-purple-200 dark:to-indigo-300"
    >
      {getHomeHeadline()}
    </h1>
    <p className="mx-auto mt-0 mb-6 max-w-2xl text-base leading-relaxed text-base-content/90 sm:text-lg dark:text-gray-200">
      {`Read-only: no approvals on your Aave position and no minimum size. We check every ${NOTIFICATION_CHECK_INTERVAL_MINUTES} minutes and alert you by ${formatAlertChannels("or")} whenever your health factor is below the line you set.`}
    </p>
    <DashboardCta />
    <div className="mt-6 flex flex-col items-center gap-3">
      <BadgeRow label="Networks:" names={getNetworkBadgeNames()} />
      <BadgeRow label="Alerts by:" names={getChannelBadgeNames()} />
      <p className="m-0 text-xs text-base-content/70 dark:text-gray-400">Aave V3 only. On Ethereum, the Core market.</p>
    </div>
  </section>
);
