"use client";

import { type FocusEvent, type KeyboardEvent, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { hardhat } from "viem/chains";
import { TokenpingLogo } from "~~/components/brand/TokenpingLogo";
import { Container } from "~~/components/home/marketingLayout";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { ThemeToggle } from "~~/components/ui/ThemeToggle";
import { cx } from "~~/components/ui/classNames";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type MenuLink = {
  label: string;
  href: string;
  /** Also active on the pages below href (every post under /blog). */
  includesNested?: boolean;
};

const MENU_LINKS: readonly MenuLink[] = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/aave" },
  { label: "Blog", href: "/blog", includesNested: true },
];

const isMenuLinkActive = (pathname: string, { href, includesNested }: MenuLink) =>
  pathname === href || (!!includesNested && pathname.startsWith(`${href}/`));

// Hover and the active link share the accent surface; never pink, never an opacity fade.
const ACTIVE_LINK_CLASS_NAME = "bg-accent text-accent-foreground";

const DESKTOP_LINK_CLASS_NAME =
  "inline-flex h-10 items-center rounded-lg px-3 text-[0.9375rem] font-medium transition-colors duration-150 ease-[ease] hover:bg-accent hover:text-accent-foreground pointer-coarse:h-11";

const MOBILE_LINK_CLASS_NAME =
  "flex min-h-11 items-center rounded-lg px-3 text-base font-medium transition-colors duration-150 ease-[ease] hover:bg-accent hover:text-accent-foreground";

// The menu panel's recipe: the popover surface and the 14px menu radius. Its link list scrolls on short screens and
// keeps 4px of padding, the room the 2px focus ring needs at its 2px offset inside a scroll box.
const MENU_PANEL_CLASS_NAME =
  "absolute top-full right-[max(1.25rem,env(safe-area-inset-right))] mt-2 w-[min(20rem,calc(100vw-2.5rem))] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-frame";

const HeaderMenuLinks = ({ linkClassName }: { linkClassName: string }) => {
  const pathname = usePathname();

  return (
    <>
      {MENU_LINKS.map(link => {
        const { label, href } = link;
        const isActive = isMenuLinkActive(pathname, link);
        return (
          <li key={href} className="m-0 p-0">
            <Link
              href={href}
              // "page" only on the exact route: on a post, Blog is highlighted but is not the current page.
              aria-current={pathname === href ? "page" : undefined}
              className={cx(isActive ? ACTIVE_LINK_CLASS_NAME : "text-foreground/80", linkClassName)}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * The sticky 64px bar: logo, the main links, the wallet button and the theme toggle. Below lg the links move into a
 * menu panel (44px rows, plus the theme toggle). The logo lockup keeps at least 110px of width (h-7, h-8 from md) and
 * never shrinks; it carries no tagline. The bar is translucent over the hero wash. The skip link comes before it, at
 * the start of the beta strip.
 *
 * The menu is a disclosure, not a modal: the page stays live behind it, so focus is not trapped. Instead the panel
 * closes on Escape (focus back on its button), when focus or a click leaves it, on a link click and on a route change.
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const pathname = usePathname();

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  const closeMenu = useCallback(() => {
    burgerMenuRef.current?.removeAttribute("open");
  }, []);
  useOutsideClick(burgerMenuRef, closeMenu);

  // Back and forward change the route without a click in the menu.
  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  // <details> has no Escape handling of its own.
  const closeOnEscape = (event: KeyboardEvent<HTMLDetailsElement>) => {
    if (event.key !== "Escape" || !burgerMenuRef.current?.open) return;
    closeMenu();
    burgerMenuRef.current.querySelector("summary")?.focus();
  };

  // Tabbing past the last item (or back past the button) closes the panel. A null target (another window, a click on
  // the panel's padding) keeps it open; clicks outside are the outside-click hook's job.
  const closeOnFocusLeave = (event: FocusEvent<HTMLDetailsElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && !event.currentTarget.contains(next)) closeMenu();
  };

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 safe-area-top">
      <Container className="flex h-16 items-center gap-2 sm:gap-4 lg:gap-8">
        <Link
          href="/"
          aria-label="Tokenping home"
          className="inline-flex shrink-0 items-center rounded-lg pointer-coarse:min-h-11"
        >
          <TokenpingLogo title="" className="h-7 w-auto md:h-8" />
        </Link>

        {/* One landmark for both menus: only one of them shows at a time. */}
        <nav aria-label="Main" className="ml-auto lg:ml-0 lg:flex-1">
          <ul className="m-0 hidden list-none items-center gap-1 p-0 lg:flex">
            <HeaderMenuLinks linkClassName={DESKTOP_LINK_CLASS_NAME} />
          </ul>
          <details className="lg:hidden" ref={burgerMenuRef} onKeyDown={closeOnEscape} onBlur={closeOnFocusLeave}>
            <summary
              aria-label="Open menu"
              className="flex size-11 cursor-pointer list-none items-center justify-center rounded-lg text-foreground transition-colors duration-150 ease-[ease] hover:bg-accent hover:text-accent-foreground [&::-webkit-details-marker]:hidden"
            >
              <Menu aria-hidden="true" className="size-4" />
            </summary>
            {/* Anchored to the sticky header (its containing block), under the bar's right edge. */}
            <div className={MENU_PANEL_CLASS_NAME}>
              <ul
                className="m-0 flex max-h-[calc(100dvh-8rem)] list-none flex-col gap-1 overflow-y-auto p-1"
                onClick={closeMenu}
              >
                <HeaderMenuLinks linkClassName={MOBILE_LINK_CLASS_NAME} />
              </ul>
              <div className="mx-1 mt-1 mb-1 flex items-center justify-between border-t border-border px-3 pt-2 text-sm text-muted-foreground">
                <span>Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </details>
        </nav>

        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <RainbowKitCustomConnectButton />
          {isLocalNetwork && <FaucetButton />}
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
        </div>
      </Container>
    </header>
  );
};
