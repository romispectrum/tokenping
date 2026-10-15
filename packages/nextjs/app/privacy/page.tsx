import type { ReactNode } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { BlogPageShell } from "~~/components/blog/BlogPageShell";
import { ARTICLE_LINK_CLASS_NAME } from "~~/components/blog/MdxElements";
import { formatPostDate } from "~~/components/blog/formatPostDate";
import { Breadcrumbs } from "~~/components/seo/Breadcrumbs";
import { JsonLd } from "~~/components/seo/JsonLd";
import { EXTERNAL_LINK_REL, SOCIAL_LINKS } from "~~/constants/links";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { getAlertChannelNames } from "~~/services/marketing/alertChannels";
import { getPaymentChainName } from "~~/services/marketing/paymentChain";
import { type Crumb, breadcrumbJsonLd, pageMetadata, toIsoDateTime } from "~~/utils/seo";

export const metadata = pageMetadata({
  title: "Privacy and Data",
  description:
    "What Tokenping stores when you set an Aave health factor alert, what it does not store, which services handle your data and how to delete it.",
  path: "/privacy",
});

/** Change only when the content below changes. */
const LAST_UPDATED = "2026-10-14";

const CRUMBS: Crumb[] = [{ name: "Home", path: "/" }, { name: "Privacy" }];

const H2_CLASS_NAME = "mt-10 mb-3 text-2xl font-bold leading-tight text-base-content";
const TEXT_CLASS_NAME = "my-4 leading-relaxed text-base-content/90 dark:text-gray-200";
const LIST_CLASS_NAME =
  "my-4 list-disc space-y-2 pl-6 marker:text-base-content/50 text-base-content/90 dark:text-gray-200";

type Processor = {
  name: string;
  role: string;
  receives: string;
};

const SectionHeading = ({ children }: { children: ReactNode }) => <h2 className={H2_CLASS_NAME}>{children}</h2>;

/**
 * Plain-language data page, written from the code (marketing product facts §7, §10.9). It must not call the product
 * "private" or "secure": settings are tied to a wallet address without a wallet-ownership check yet, so the config
 * and Telegram link reads answer anyone who sends an address, and writes only check that address's paid access.
 */
const PrivacyPage: NextPage = () => {
  const hasTelegram = getAlertChannelNames().includes("Telegram");
  const paymentChainName = getPaymentChainName() ?? "the payment network";

  const processors: Processor[] = [
    {
      name: "Vercel",
      role: `Hosts this site and runs the alert check every ${NOTIFICATION_CHECK_INTERVAL_MINUTES} minutes.`,
      receives: "Every request to the site, including your IP address, and our server logs.",
    },
    {
      name: "Supabase",
      role: "Our database.",
      receives: "The alert settings listed above.",
    },
    {
      name: "Resend",
      role: "Sends alert emails.",
      receives: "Your email address and the alert text.",
    },
    {
      name: "Fly.io (our Signal relay)",
      role: "Hosts the signal-cli-rest-api server we run, which hands Signal alerts to Signal.",
      receives: "Your Signal username and the alert text (and so does Signal).",
    },
    ...(hasTelegram
      ? [
          {
            name: "Telegram",
            role: "Delivers Telegram alerts through its Bot API.",
            receives: "Your Telegram chat ID and the alert text.",
          },
        ]
      : []),
    {
      name: "RPC providers (PublicNode, Alchemy and the networks' public endpoints)",
      role: "Answer the blockchain reads: from your browser for the dashboard, and from our server for alert checks.",
      receives: "The wallet address being read, and your IP address for reads made from your browser.",
    },
    {
      name: "WalletConnect",
      role: "Relays the connection between this site and your wallet app, if you connect with WalletConnect.",
      receives: "What your wallet app and this site exchange to connect, such as your wallet address.",
    },
  ];

  return (
    <BlogPageShell>
      <Breadcrumbs crumbs={CRUMBS} />
      <article className="rounded-3xl border border-base-300 bg-base-100 p-5 sm:p-8 dark:border-white/10 dark:bg-gray-900/70">
        <header className="mb-2">
          <h1 className="m-0 mb-3 text-3xl sm:text-4xl font-bold leading-tight text-base-content">
            Privacy: what Tokenping stores and who handles it
          </h1>
          <p className="m-0 text-sm text-base-content/70 dark:text-gray-400">
            Last updated <time dateTime={toIsoDateTime(LAST_UPDATED)}>{formatPostDate(LAST_UPDATED)}</time>
          </p>
        </header>

        <p className={TEXT_CLASS_NAME}>
          This page describes what the app does today. Tokenping is in beta, and we update this page when what we
          collect changes.
        </p>

        <SectionHeading>What you can do without giving us anything</SectionHeading>
        <p className={TEXT_CLASS_NAME}>
          Reading the site and the blog, and looking at your positions on the dashboard, adds nothing to our database.
          To show your positions, your browser asks RPC providers (listed below) for your wallet&apos;s Aave data, so
          they see your wallet address.
        </p>

        <SectionHeading>What we store when you save an alert</SectionHeading>
        <ul className={LIST_CLASS_NAME}>
          <li>Your wallet address.</li>
          <li>The network the alert is for, and your threshold.</li>
          <li>The channels you picked.</li>
          <li>Your email address, if you chose email.</li>
          <li>Your Signal username, if you chose Signal.</li>
          <li>When the alert was created and last changed.</li>
        </ul>
        {hasTelegram && (
          <p className={TEXT_CLASS_NAME}>
            If you link Telegram, we also store your Telegram chat ID, your Telegram username and when you linked it.
            Linking uses a one-time code tied to your wallet address that expires after 10 minutes.
          </p>
        )}
        <p className={TEXT_CLASS_NAME}>
          If you answer the optional &quot;How did you hear about Tokenping?&quot; question after saving an alert, we
          store your answer and the time with your wallet address.
        </p>

        <SectionHeading>What we don&apos;t store</SectionHeading>
        <ul className={LIST_CLASS_NAME}>
          <li>Your positions or a history of your health factor. They are read live and not saved.</li>
          <li>A log of the alerts we sent.</li>
          <li>
            Analytics, tracking pixels or advertising cookies: the site uses none, and Tokenping sets no cookies. Your
            browser keeps your theme choice, your wallet connection and whether it has already shown you the &quot;How
            did you hear about Tokenping?&quot; question in its own local storage.
          </li>
          <li>
            IP addresses in our database. Vercel still handles every request, as listed below. When an alert check or a
            message fails, the error, which can include your wallet address and the recipient, goes to our server logs.
          </li>
        </ul>

        <SectionHeading>Who can see your alert settings</SectionHeading>
        <p className={TEXT_CLASS_NAME}>
          Alert settings are tied to a wallet address, not to an account with a password, and the app does not yet ask
          you to sign a message proving that you own the wallet.
        </p>
        <p className={TEXT_CLASS_NAME}>
          {`Until the app checks wallet signatures, anyone who knows your wallet address can look up the email address${hasTelegram ? ", Signal username and Telegram username" : " and Signal username"} saved for it and, while that wallet's access is active, change or delete its alerts. The public payment records described below show which wallets have paid.`}
        </p>
        <p className={TEXT_CLASS_NAME}>
          Don&apos;t enter an email address or Signal username you wouldn&apos;t want linked to your wallet address.
        </p>

        <SectionHeading>Who handles your data</SectionHeading>
        {/* A list rather than a table: three columns of prose do not fit a phone without sideways scrolling. */}
        <dl className="my-4 grid gap-3">
          {processors.map(({ name, role, receives }) => (
            <div
              key={name}
              className="rounded-2xl border border-base-300 bg-base-200/60 p-4 dark:border-white/10 dark:bg-gray-900/40"
            >
              <dt className="font-semibold text-base-content">{name}</dt>
              <dd className="m-0 mt-1 leading-relaxed text-base-content/90 dark:text-gray-200">{role}</dd>
              <dd className="m-0 mt-1 leading-relaxed text-base-content/90 dark:text-gray-200">{`Receives: ${receives}`}</dd>
            </div>
          ))}
        </dl>
        <p className={TEXT_CLASS_NAME}>Each of these services handles that data under its own privacy policy.</p>

        <SectionHeading>What is public on the blockchain</SectionHeading>
        <p className={TEXT_CLASS_NAME}>
          {`Paying for alerts happens on ${paymentChainName}. Each payment records the paying address, the token, the amount, the time, the period bought and the new expiry date in a public event that anyone can read and nobody can delete. Your alert settings are never written to a blockchain.`}
        </p>

        <SectionHeading>How long we keep it, and how to delete it</SectionHeading>
        <ul className={LIST_CLASS_NAME}>
          <li>
            Alert settings stay until you delete the alert in the dashboard. Deleting removes that network&apos;s
            settings, including the email address and Signal username, and needs active access.
          </li>
          {hasTelegram && (
            <li>Sending /stop to the Tokenping bot in Telegram unlinks your chat and stops Telegram alerts.</li>
          )}
          <li>
            If your access has expired, or you want your &quot;How did you hear about Tokenping?&quot; answer removed,
            message us on{" "}
            <a href={SOCIAL_LINKS.x} rel={EXTERNAL_LINK_REL} className={ARTICLE_LINK_CLASS_NAME}>
              X
            </a>{" "}
            or in our{" "}
            <a href={SOCIAL_LINKS.telegram} rel={EXTERNAL_LINK_REL} className={ARTICLE_LINK_CLASS_NAME}>
              Telegram community
            </a>{" "}
            and we&apos;ll delete it.
          </li>
          <li>Payments on the blockchain can&apos;t be deleted by anyone.</li>
        </ul>

        <p className={TEXT_CLASS_NAME}>
          Questions about how alerts work are answered on the{" "}
          <Link href="/" className={ARTICLE_LINK_CLASS_NAME}>
            homepage
          </Link>
          .
        </p>
      </article>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
    </BlogPageShell>
  );
};

export default PrivacyPage;
