"use client";

import Link from "next/link";
import { useFetchNativeCurrencyPrice } from "@scaffold-ui/hooks";
import { hardhat } from "viem/chains";
import { CurrencyDollarIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { Faucet } from "~~/components/scaffold-eth";
import { EXTERNAL_LINK_REL, SOCIAL_LINKS, SOURCE_CODE_URL } from "~~/constants/links";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { RSS_PATH } from "~~/utils/seo";

type FooterLink = {
  label: string;
  href: string;
  /** page: next/link; feed: a plain same-tab link to a route handler; external: a new tab. */
  kind: "page" | "feed" | "external";
  /** Keeps the visible label in the accessible name and says whose profile it is. */
  ariaLabel?: string;
};

const FOOTER_LINKS: readonly FooterLink[] = [
  { label: "Blog", href: "/blog", kind: "page" },
  { label: "RSS", href: RSS_PATH, kind: "feed", ariaLabel: "Tokenping blog RSS feed" },
  { label: "GitHub", href: SOURCE_CODE_URL, kind: "external", ariaLabel: "Tokenping source code on GitHub" },
  { label: "X", href: SOCIAL_LINKS.x, kind: "external", ariaLabel: "Tokenping on X" },
  { label: "Telegram", href: SOCIAL_LINKS.telegram, kind: "external", ariaLabel: "Tokenping Telegram Community" },
  { label: "Privacy", href: "/privacy", kind: "page" },
];

const FooterLinkItem = ({ label, href, kind, ariaLabel }: FooterLink) => {
  if (kind === "page")
    return (
      <Link href={href} className="link" aria-label={ariaLabel}>
        {label}
      </Link>
    );
  return (
    <a
      href={href}
      className="link"
      aria-label={ariaLabel}
      {...(kind === "external" && { target: "_blank", rel: EXTERNAL_LINK_REL })}
    >
      {label}
    </a>
  );
};

export const Footer = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const { price: nativeCurrencyPrice } = useFetchNativeCurrencyPrice();

  return (
    <footer className="min-h-0 py-5 px-1 mb-11 lg:mb-0">
      <div>
        <div className="fixed flex justify-between items-center w-full z-10 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bottom-0 left-0 pointer-events-none safe-area-inset-left safe-area-inset-right">
          <div className="flex flex-col sm:flex-row gap-2 pointer-events-auto">
            {nativeCurrencyPrice > 0 && (
              <div>
                <div className="btn btn-primary btn-sm font-normal gap-1 cursor-auto touch-target-min min-h-9">
                  <CurrencyDollarIcon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{nativeCurrencyPrice.toFixed(2)}</span>
                </div>
              </div>
            )}
            {isLocalNetwork && (
              <>
                <Faucet />
                <Link
                  href="/blockexplorer"
                  className="btn btn-primary btn-sm font-normal gap-1 touch-target-min min-h-9"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">Block Explorer</span>
                  <span className="sm:hidden">Explorer</span>
                </Link>
              </>
            )}
          </div>
          <SwitchTheme className={`pointer-events-auto ${isLocalNetwork ? "self-end md:self-auto" : ""}`} />
        </div>
      </div>
      <div className="w-full">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 p-2 text-sm w-full">
            {FOOTER_LINKS.map(link => (
              <li key={link.href} className="flex">
                <FooterLinkItem {...link} />
              </li>
            ))}
          </ul>
        </nav>
        <p className="m-0 px-4 text-center text-xs text-base-content/70">
          Independent tool, not affiliated with Aave Labs or the Aave DAO.
        </p>
      </div>
    </footer>
  );
};
