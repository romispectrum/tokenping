"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { hardhat } from "viem/chains";
import { TokenpingLogo } from "~~/components/brand/TokenpingLogo";
import { AddressChip } from "~~/components/custom/aave/AddressChip";
import { Container } from "~~/components/home/marketingLayout";
import { Faucet } from "~~/components/scaffold-eth";
import { ThemeChoice } from "~~/components/ui/ThemeChoice";
import { buttonClasses } from "~~/components/ui/buttonClasses";
import { cx } from "~~/components/ui/classNames";
import { DONATION, EXTERNAL_LINK_REL, SOCIAL_LINKS, SOURCE_CODE_URL } from "~~/constants/links";
import { useEthPrice } from "~~/hooks/custom/useEthPrice";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useLocale, useMessages } from "~~/i18n/LocaleProvider";
import type { Locale } from "~~/i18n/locales";
import { COMMON_MESSAGES } from "~~/i18n/messages/common";
import { routePath } from "~~/i18n/routes";
import { formatAlertChannelsIn } from "~~/services/marketing/alertChannels";

type FooterLink = {
  label: string;
  href: string;
  /** page: next/link; feed: a plain same-tab link to a route handler; external: a new tab. */
  kind: "page" | "feed" | "external";
  /** Keeps the visible label in the accessible name and says whose profile it is. */
  ariaLabel?: string;
};

type FooterGroup = {
  /** Also the heading id, prefixed with "footer-". */
  id: string;
  title: string;
  links: readonly FooterLink[];
};

const footerGroups = (locale: Locale): readonly FooterGroup[] => {
  const t = COMMON_MESSAGES[locale].footer;
  return [
    {
      id: "resources",
      title: t.resources,
      links: [
        { label: t.blog, href: routePath(locale, "blog"), kind: "page" },
        { label: t.rss, href: routePath(locale, "blogFeed"), kind: "feed", ariaLabel: t.rssLabel },
        { label: "GitHub", href: SOURCE_CODE_URL, kind: "external", ariaLabel: t.githubLabel },
      ],
    },
    {
      id: "community",
      title: t.community,
      links: [
        { label: "X", href: SOCIAL_LINKS.x, kind: "external", ariaLabel: t.xLabel },
        { label: "Telegram", href: SOCIAL_LINKS.telegram, kind: "external", ariaLabel: t.telegramLabel },
        { label: "Signal", href: SOCIAL_LINKS.signal, kind: "external", ariaLabel: t.signalLabel },
      ],
    },
    {
      id: "legal",
      title: t.legal,
      links: [{ label: t.privacy, href: routePath(locale, "privacy"), kind: "page" }],
    },
  ];
};

// Muted at rest, white and underlined on hover; 32px rows for a mouse, 44px on touch screens.
const LINK_CLASS_NAME =
  "inline-flex min-h-8 items-center rounded-sm text-sm text-muted-foreground underline-offset-4 transition-colors duration-150 ease-[ease] hover:text-foreground hover:underline pointer-coarse:min-h-11";

const FooterLinkItem = ({ label, href, kind, ariaLabel }: FooterLink) => {
  if (kind === "page")
    return (
      <Link href={href} className={LINK_CLASS_NAME} aria-label={ariaLabel}>
        {label}
      </Link>
    );
  return (
    <a
      href={href}
      className={LINK_CLASS_NAME}
      aria-label={ariaLabel}
      {...(kind === "external" && { target: "_blank", rel: EXTERNAL_LINK_REL })}
    >
      {label}
    </a>
  );
};

/**
 * The site footer: an always-dark band (the `dark` class switches every token inside it, the logo to its outline
 * art included) with no pink in it. The ETH price sits in the band's bottom row, in the page flow, so it never covers
 * content. Only the local network adds a floating developer row in the page theme: the faucet and the block explorer.
 */
export const Footer = () => {
  const locale = useLocale();
  const t = useMessages(COMMON_MESSAGES);
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  // From this site's API, which reads the mainnet DAI/WETH pool server-side: no RPC call from the browser for it.
  const ethPrice = useEthPrice();

  return (
    <footer>
      {isLocalNetwork && (
        <div className="pointer-events-none fixed bottom-0 left-0 z-10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))]">
          <div className="pointer-events-auto flex flex-col gap-2 sm:flex-row">
            <Faucet />
            <Link href="/blockexplorer" className={buttonClasses({ variant: "outline", size: "sm" })}>
              <Search aria-hidden="true" />
              <span className="hidden sm:inline">{t.footer.blockExplorer}</span>
              <span className="sm:hidden">{t.footer.blockExplorerShort}</span>
            </Link>
          </div>
        </div>
      )}

      <div className="dark border-t border-border bg-background">
        <Container className="grid gap-10 pt-14 pb-10 md:pt-16 lg:grid-cols-[2fr_3fr] lg:gap-12">
          <div className="flex flex-col gap-5">
            <Link
              href={routePath(locale, "home")}
              aria-label={t.homeLabel}
              className="inline-flex w-fit shrink-0 items-center rounded-lg pointer-coarse:min-h-11"
            >
              {/* h-9: 137px wide, above the 100px lockup minimum */}
              <TokenpingLogo title="" className="h-9 w-auto" />
            </Link>
            <p className="m-0 max-w-xs text-sm text-pretty text-muted-foreground">
              {t.footer.tagline(formatAlertChannelsIn(locale, "conjunction"))}
            </p>
            {/* The name and the address as plain text with a copy button: no ENS lookup, so no RPC call per page. */}
            <section aria-labelledby="footer-donate" className="flex flex-col gap-2">
              <h2 id="footer-donate" className="m-0 text-sm font-medium text-foreground">
                {t.footer.donate}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-data text-sm text-foreground">{DONATION.ens}</span>
                <AddressChip address={DONATION.address} label={t.footer.donationAddress} />
              </div>
            </section>
          </div>

          <nav aria-label={t.footer.navLabel} className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:gap-12">
            {footerGroups(locale).map(({ id, title, links }) => (
              <div key={id}>
                <h2 id={`footer-${id}`} className="m-0 text-sm font-medium text-foreground">
                  {title}
                </h2>
                <ul aria-labelledby={`footer-${id}`} className="m-0 mt-3 flex list-none flex-col gap-1 p-0 md:mt-4">
                  {links.map(link => (
                    <li key={link.href} className="m-0 flex p-0">
                      <FooterLinkItem {...link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </Container>

        <Container>
          <div
            className={cx(
              "flex flex-col gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
              // The local network's floating developer row would cover the last line.
              isLocalNetwork ? "pb-28 sm:pb-20" : "pb-[max(2.5rem,env(safe-area-inset-bottom))]",
            )}
          >
            <p className="m-0">{t.footer.independence}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {ethPrice !== null && (
                // Named in words: a dollar sign alone does not say which price this is.
                <p className="m-0 tabular-nums">{t.footer.ethPrice(ethPrice.toFixed(2))}</p>
              )}
              <ThemeChoice />
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
};
