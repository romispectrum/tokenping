import Link from "next/link";
import { formatAlertPrice } from "~~/components/blog/AlertPrice";
import { getPaywallSourcifyUrl, getPublishedPost } from "~~/components/home/homeContent";
import { HOME_CARD_CLASS_NAME, HomeSection, externalLinkText } from "~~/components/home/homeUi";
import { cx } from "~~/components/ui/classNames";
import { SOCIAL_LINKS, SOURCE_CODE_URL } from "~~/constants/links";
import { MORPHO_HEALTH_FACTOR_THRESHOLD_MIN, NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import type { Locale } from "~~/i18n/locales";
import { HOME_MESSAGES } from "~~/i18n/messages/home";
import { postPath, routePath } from "~~/i18n/routes";
import { getAlertChannelNames } from "~~/services/marketing/alertChannels";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { getPaymentChainName } from "~~/services/marketing/paymentChain";

/**
 * The homepage's questions and answers for this deployment (price, payment chain, channels, published guides). The page
 * renders them and its FAQPage JSON-LD repeats them, from the same array.
 */
export const getHomeQuestions = (plan: AlertPlan | null, locale: Locale) => {
  const t = HOME_MESSAGES[locale];
  const sourcifyUrl = getPaywallSourcifyUrl();
  const comparison = getPublishedPost("aave-liquidation-alert-tools", locale);

  return t.questions({
    alertPrice: formatAlertPrice(plan, locale),
    paymentChain: getPaymentChainName(),
    hasTelegram: getAlertChannelNames().includes("Telegram"),
    minutes: NOTIFICATION_CHECK_INTERVAL_MINUTES,
    morphoMin: MORPHO_HEALTH_FACTOR_THRESHOLD_MIN,
    links: {
      sourcify: sourcifyUrl ? externalLinkText(sourcifyUrl) : undefined,
      sourceCode: externalLinkText(SOURCE_CODE_URL),
      privacy: text => <Link href={routePath(locale, "privacy")}>{text}</Link>,
      x: externalLinkText(SOCIAL_LINKS.x),
      telegramCommunity: externalLinkText(SOCIAL_LINKS.telegram),
      signalCommunity: externalLinkText(SOCIAL_LINKS.signal),
      comparison: comparison && (text => <Link href={postPath(locale, comparison.meta.slug)}>{text}</Link>),
      morphoDashboard: text => <Link href={routePath(locale, "morpho")}>{text}</Link>,
    },
  });
};

type HomeObjectionsProps = {
  questions: ReturnType<typeof getHomeQuestions>;
  locale: Locale;
};

/**
 * The blockers a borrower checks before connecting a wallet, as visible <h3> questions with short prose answers: no
 * accordion that hides answers from crawlers. Every answer stays within what the code and the contract do today and
 * points to the page that has the detail. Static cards on the lavender wash, no pink; two columns from lg.
 */
export const HomeObjections = ({ questions, locale }: HomeObjectionsProps) => {
  const t = HOME_MESSAGES[locale];

  return (
    <HomeSection id="questions" title={t.questionsTitle} surface="wash" width="wide">
      {/* Two balanced columns from lg (the browser splits the uneven answers); one column before, since two
          columns on a tablet drop the answers under 45 characters a line. The margin is the gap in both modes:
          multicol ignores grid gaps. */}
      <div className="lg:columns-2 lg:gap-x-4">
        {questions.map(({ question, answer }) => (
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
