"use client";

import Link from "next/link";
import { useFetchNativeCurrencyPrice } from "@scaffold-ui/hooks";
import { Search } from "lucide-react";
import { hardhat } from "viem/chains";
import { TokenpingLogo } from "~~/components/brand/TokenpingLogo";
import { Container } from "~~/components/home/marketingLayout";
import { Faucet } from "~~/components/scaffold-eth";
import { ThemeChoice } from "~~/components/ui/ThemeChoice";
import { buttonClasses } from "~~/components/ui/buttonClasses";
import { cx } from "~~/components/ui/classNames";
import { EXTERNAL_LINK_REL, SOCIAL_LINKS, SOURCE_CODE_URL } from "~~/constants/links";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { formatAlertChannels } from "~~/services/marketing/alertChannels";
import { RSS_PATH } from "~~/utils/seo";

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

const FOOTER_GROUPS: readonly FooterGroup[] = [
  {
    id: "resources",
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog", kind: "page" },
      { label: "RSS", href: RSS_PATH, kind: "feed", ariaLabel: "Tokenping blog RSS feed" },
      { label: "GitHub", href: SOURCE_CODE_URL, kind: "external", ariaLabel: "Tokenping source code on GitHub" },
    ],
  },
  {
    id: "community",
    title: "Community",
    links: [
      { label: "X", href: SOCIAL_LINKS.x, kind: "external", ariaLabel: "Tokenping on X" },
      { label: "Telegram", href: SOCIAL_LINKS.telegram, kind: "external", ariaLabel: "Tokenping Telegram community" },
    ],
  },
  {
    id: "legal",
    title: "Legal",
    links: [{ label: "Privacy", href: "/privacy", kind: "page" }],
  },
];

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
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  // No chain argument: the hook reads the mainnet WETH/DAI pool, so this is the ETH price in US dollars.
  const { price: ethPrice } = useFetchNativeCurrencyPrice();

  return (
    <footer>
      {isLocalNetwork && (
        <div className="pointer-events-none fixed bottom-0 left-0 z-10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))]">
          <div className="pointer-events-auto flex flex-col gap-2 sm:flex-row">
            <Faucet />
            <Link href="/blockexplorer" className={buttonClasses({ variant: "outline", size: "sm" })}>
              <Search aria-hidden="true" />
              <span className="hidden sm:inline">Block explorer</span>
              <span className="sm:hidden">Explorer</span>
            </Link>
          </div>
        </div>
      )}

      <div className="dark border-t border-border bg-background">
        <Container className="grid gap-10 pt-14 pb-10 md:pt-16 lg:grid-cols-[2fr_3fr] lg:gap-12">
          <div className="flex flex-col gap-5">
            <Link
              href="/"
              aria-label="Tokenping home"
              className="inline-flex w-fit shrink-0 items-center rounded-lg pointer-coarse:min-h-11"
            >
              {/* h-9: 137px wide, above the 100px lockup minimum */}
              <TokenpingLogo title="" className="h-9 w-auto" />
            </Link>
            <p className="m-0 max-w-xs text-sm text-pretty text-muted-foreground">
              {`Aave V3 health factor alerts on ${formatAlertChannels("and")}.`}
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:gap-12">
            {FOOTER_GROUPS.map(({ id, title, links }) => (
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
            <p className="m-0">Independent tool, not affiliated with Aave Labs or the Aave DAO.</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {ethPrice > 0 && (
                // Named in words: a dollar sign alone does not say which price this is.
                <p className="m-0 tabular-nums">{`ETH price: $${ethPrice.toFixed(2)}`}</p>
              )}
              <ThemeChoice />
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
};
