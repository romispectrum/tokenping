import type { ReactNode } from "react";
import Link from "next/link";
import { formatAlertPrice } from "~~/components/blog/AlertPrice";
import { getNetworkNames, getPaywallSourcifyUrl, getPublishedPost, joinList } from "~~/components/home/homeContent";
import { ExternalLink, HOME_CARD_CLASS_NAME, HomeSection } from "~~/components/home/homeUi";
import { cx } from "~~/components/ui/classNames";
import { SOCIAL_LINKS, SOURCE_CODE_URL } from "~~/constants/links";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { DEFAULT_LOCALE } from "~~/i18n/locales";
import { postPath } from "~~/i18n/routes";
import { getAlertChannelNames } from "~~/services/marketing/alertChannels";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { getPaymentChainName } from "~~/services/marketing/paymentChain";

type Objection = {
  question: string;
  answer: ReactNode;
};

type HomeObjectionsProps = {
  plan: AlertPlan | null;
};

/**
 * The blockers a borrower checks before connecting a wallet, as visible <h3> questions with prose answers: no
 * accordion that hides answers from crawlers and no FAQPage schema (marketing plan §2.4, §4.5). Every answer stays
 * within what the code and the contract do today. Static cards on the lavender wash, no pink; two columns from lg so
 * the longest section of the page is also readable at about 60 characters a line.
 */
export const HomeObjections = ({ plan }: HomeObjectionsProps) => {
  const hasTelegram = getAlertChannelNames().includes("Telegram");
  const chainName = getPaymentChainName() ?? "the payment network";
  const sourcifyUrl = getPaywallSourcifyUrl();
  const comparison = getPublishedPost("aave-liquidation-alert-tools");

  const objections: Objection[] = [
    {
      question: "Can Tokenping touch my funds?",
      answer: (
        <>
          No. Tokenping reads your positions and health factor with read-only calls and never asks for an approval or a
          signature on Aave. The only wallet transactions are the payment for alerts: an approval for exactly the price,
          never an unlimited one, then the payment, both on {chainName}. The payment contract
          {sourcifyUrl && (
            <>
              {" "}
              is <ExternalLink href={sourcifyUrl}>verified on Sourcify</ExternalLink> and its
            </>
          )}{" "}
          <ExternalLink href={SOURCE_CODE_URL}>source code is public on GitHub</ExternalLink>. It is upgradeable and
          controlled by the Tokenping team&apos;s wallet, which can change the price, pause payments, withdraw what was
          paid and upgrade the contract.
        </>
      ),
    },
    {
      question: "What do you store?",
      answer: (
        <>
          Your wallet address, the networks and thresholds you set, the channels you picked, and your email address
          and/or Signal username
          {hasTelegram ? ", plus your Telegram chat ID and username if you link Telegram" : ""}. If you answer the
          optional &quot;How did you hear about Tokenping?&quot; question, that answer too. Tokenping keeps no health
          factor history and no log of sent alerts, and this site runs no analytics. To read your positions, your wallet
          address is sent to RPC providers. Payments are public on {chainName}: anyone can see the paying address, the
          amount and the new expiry. Until the app checks wallet signatures, anyone who knows your wallet address can
          look up the contact details saved for it. The <Link href="/privacy">privacy page</Link> explains this and
          lists every service that handles your data.
        </>
      ),
    },
    {
      question: "What does it cost, and is there a catch?",
      answer: (
        <>
          The dashboard is free. Alerts cost {formatAlertPrice(plan)}, paid in native USDC on {chainName} even if your
          position is on another network, so you need USDC and a little ETH for gas there. It takes two transactions:
          approve, then pay. Nothing renews automatically, and paying again extends your access from its current end
          date. The contract has no refund function.
        </>
      ),
    },
    {
      question: "What if an alert doesn't arrive?",
      answer: (
        <>
          Tokenping checks every {NOTIFICATION_CHECK_INTERVAL_MINUTES} minutes. A failed check or message is logged, and
          the next check tries again while your health factor is still below your threshold. Delivery depends on third
          parties (Resend for email, a Signal relay,{hasTelegram ? " the Telegram Bot API," : ""} public RPC nodes and
          Vercel&apos;s scheduler), and Tokenping is in beta with no uptime guarantee. A fast crash can cross 1.0
          between two checks. So pick two channels, set your threshold with room to act, and don&apos;t make an alert
          your only safeguard.
        </>
      ),
    },
    {
      question: "Is my position supported?",
      answer: (
        <>
          {`Aave V3 on ${joinList(getNetworkNames())}. Not supported: Aave V4 (live on Ethereum, Avalanche, Arc and Base as of October 2026), the other Aave V3 markets on Ethereum (Prime/Lido, EtherFi, Horizon), other Aave networks and other protocols. You get one alert per network, for the wallet you connect.`}
        </>
      ),
    },
    {
      question: "How often will I be alerted, and how do I stop it?",
      answer: (
        <>
          Every {NOTIFICATION_CHECK_INTERVAL_MINUTES} minutes on each channel you picked, for as long as your health
          factor is below your threshold. Alerts stop when it is back at or above your threshold, or when you delete the
          alert, which needs active access. If your access has expired, message us on{" "}
          <ExternalLink href={SOCIAL_LINKS.x}>X</ExternalLink> or in our{" "}
          <ExternalLink href={SOCIAL_LINKS.telegram}>Telegram community</ExternalLink> and we&apos;ll delete it.
          {hasTelegram ? " In Telegram you can also send /stop to the alert bot." : ""} There is no snooze, no
          &quot;recovered&quot; message and no unsubscribe link in the emails yet.
        </>
      ),
    },
    {
      question: "Can I watch a wallet I don't connect, or several wallets?",
      answer: <>Not today. Tokenping watches the wallet you connect, and access is per paying wallet.</>,
    },
    {
      question: "Other tools are free. Why pay?",
      answer: (
        <>
          If a Telegram bot or a mobile app works for you and you&apos;d rather paste any address than connect a wallet,
          free tools exist
          {comparison ? (
            <>
              :{" "}
              <Link href={postPath(DEFAULT_LOCALE, comparison.meta.slug)}>
                our comparison of Aave liquidation alert tools
              </Link>{" "}
              covers them, including where they beat Tokenping
            </>
          ) : null}
          . Tokenping is for people who want the alert on Signal or email, including for positions on Gnosis and
          Optimism.
        </>
      ),
    },
  ];

  return (
    <HomeSection id="questions" title="Questions to ask before you connect a wallet" surface="wash" width="wide">
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
