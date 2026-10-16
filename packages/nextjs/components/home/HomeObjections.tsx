import Link from "next/link";
import { formatAlertPrice } from "~~/components/blog/AlertPrice";
import {
  getNetworkList,
  getPaywallSourcifyUrl,
  getPublishedPost,
  getV4NetworkList,
} from "~~/components/home/homeContent";
import { HOME_CARD_CLASS_NAME, HomeSection, externalLinkText } from "~~/components/home/homeUi";
import { cx } from "~~/components/ui/classNames";
import { AAVE_MARKETS, AAVE_V4_SPOKES } from "~~/config/aaveConfig";
import { SOCIAL_LINKS, SOURCE_CODE_URL } from "~~/constants/links";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import type { Locale } from "~~/i18n/locales";
import { HOME_MESSAGES } from "~~/i18n/messages/home";
import { postPath, routePath } from "~~/i18n/routes";
import { getAlertChannelNames } from "~~/services/marketing/alertChannels";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { getPaymentChainName } from "~~/services/marketing/paymentChain";

type HomeObjectionsProps = {
  plan: AlertPlan | null;
  locale: Locale;
};

/**
 * The blockers a borrower checks before connecting a wallet, as visible <h3> questions with prose answers: no
 * accordion that hides answers from crawlers and no FAQPage schema (marketing plan §2.4, §4.5). Every answer stays
 * within what the code and the contract do today. Static cards on the lavender wash, no pink; two columns from lg so
 * the longest section of the page is also readable at about 60 characters a line.
 */
export const HomeObjections = ({ plan, locale }: HomeObjectionsProps) => {
  const t = HOME_MESSAGES[locale];
  const sourcifyUrl = getPaywallSourcifyUrl();
  const comparison = getPublishedPost("aave-liquidation-alert-tools", locale);

  const objections = t.questions({
    alertPrice: formatAlertPrice(plan, locale),
    paymentChain: getPaymentChainName(),
    hasTelegram: getAlertChannelNames().includes("Telegram"),
    minutes: NOTIFICATION_CHECK_INTERVAL_MINUTES,
    networkList: getNetworkList(locale),
    v3Markets: AAVE_MARKETS.length,
    v4NetworkList: getV4NetworkList(locale),
    spokes: AAVE_V4_SPOKES.length,
    links: {
      sourcify: sourcifyUrl ? externalLinkText(sourcifyUrl) : undefined,
      sourceCode: externalLinkText(SOURCE_CODE_URL),
      privacy: text => <Link href={routePath(locale, "privacy")}>{text}</Link>,
      x: externalLinkText(SOCIAL_LINKS.x),
      telegramCommunity: externalLinkText(SOCIAL_LINKS.telegram),
      comparison: comparison && (text => <Link href={postPath(locale, comparison.meta.slug)}>{text}</Link>),
    },
  });

  return (
    <HomeSection id="questions" title={t.questionsTitle} surface="wash" width="wide">
      {/* Two balanced columns from lg (the browser splits the uneven answers); one column before, since two
          columns on a tablet drop the answers under 45 characters a line. The margin is the gap in both modes:
          multicol ignores grid gaps. */}
      <div className="lg:columns-2 lg:gap-x-4">
        {objections.map(({ question, answer }) => (
          <div key={question} className={cx(HOME_CARD_CLASS_NAME, "mb-3 break-inside-avoid lg:mb-4")}>
            <h3 className="m-0 text-lg leading-snug font-medium">{question}</h3>
            <p className="mt-2 mb-0 text-[0.9375rem] leading-relaxed text-muted-foreground md:text-base md:leading-[1.7]">
              {answer}
            </p>
          </div>
        ))}
      </div>
    </HomeSection>
  );
};
