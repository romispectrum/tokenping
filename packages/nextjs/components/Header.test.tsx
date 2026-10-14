import { type ReactElement, type ReactNode, isValidElement } from "react";
import { arbitrum, hardhat } from "viem/chains";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "~~/components/Header";
import { renderMarkup } from "~~/utils/testing/render";

const state = vi.hoisted(() => ({
  pathname: "/",
  targetNetworkId: 42161,
  outsideClick: [] as { ref: { current: unknown }; callback: () => void }[],
}));

vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));

vi.mock("~~/hooks/scaffold-eth", () => ({
  useTargetNetwork: () => ({ targetNetwork: { id: state.targetNetworkId } }),
  useOutsideClick: (ref: { current: unknown }, callback: () => void) => {
    state.outsideClick.push({ ref, callback });
  },
}));

vi.mock("~~/components/scaffold-eth", () => ({
  RainbowKitCustomConnectButton: () => <button data-stub="connect" />,
  FaucetButton: () => <button data-stub="faucet-button" />,
}));

const renderHeader = () => renderMarkup(<Header />);

type HostProps = { children?: ReactNode; onClick?: () => void; ref?: { current: unknown } };
type HostElement = ReactElement<HostProps>;

/** Renders the header and returns the element tree it produced, so handlers that server markup drops can be invoked. */
const renderHeaderTree = () => {
  let tree: ReactNode;
  const Probe = () => {
    tree = Header();
    return tree;
  };
  renderMarkup(<Probe />);
  return tree;
};

const findElements = (node: ReactNode, matches: (element: HostElement) => boolean): HostElement[] => {
  if (Array.isArray(node)) return node.flatMap(child => findElements(child, matches));
  if (!isValidElement<HostProps>(node)) return [];
  const nested = findElements(node.props.children, matches);
  return matches(node) ? [node, ...nested] : nested;
};

describe("Header", () => {
  beforeEach(() => {
    state.pathname = "/";
    state.targetNetworkId = arbitrum.id;
    state.outsideClick = [];
  });

  it("renders the header on the home route", () => {
    expect(renderHeader()).toMatchSnapshot();
  });

  it("renders the site header as a navbar <div>", () => {
    // BUG(B4.1): the site header is an unlabelled <div>, not a <header>, so it is not the page's banner landmark.
    expect(renderHeader()).toMatch(/^<div class="sticky lg:static top-0 navbar /);
  });

  it("labels the logo with the Scaffold-ETH alt text", () => {
    // BUG(B4.4): Scaffold-ETH branding leftover in the logo alt text.
    expect(renderHeader()).toContain('alt="SE2 logo"');
  });

  it("marks only the exactly matching menu link as active", () => {
    state.pathname = "/aave";
    const activeLinks = renderHeader().match(/<a class="bg-secondary shadow-md [^"]*" href="[^"]*">/g);

    // Desktop and mobile menus both render the links.
    expect(activeLinks).toHaveLength(2);
    expect(activeLinks?.every(link => link.endsWith('href="/aave">'))).toBe(true);
  });

  it("does not mark nested or trailing-slash paths as active", () => {
    state.pathname = "/aave/";

    expect(renderHeader()).not.toContain("bg-secondary shadow-md ");
  });

  it("renders the menu links in order: Home, Aave", () => {
    const labels = [...renderHeader().matchAll(/<span>([^<]+)<\/span>/g)].map(match => match[1]);

    expect(labels).toEqual(["Home", "Aave", "Home", "Aave"]);
  });

  it("shows the faucet button only on the local network", () => {
    expect(renderHeader()).not.toContain('data-stub="faucet-button"');

    state.targetNetworkId = hardhat.id;
    const html = renderHeader();

    expect(html).toContain('data-stub="faucet-button"');
    expect(html).toMatchSnapshot();
  });

  it("closes the burger menu on an outside click", () => {
    renderHeader();
    const [{ ref, callback }] = state.outsideClick;
    const removeAttribute = vi.fn();
    ref.current = { removeAttribute };

    callback();

    expect(removeAttribute).toHaveBeenCalledWith("open");
  });

  it("ignores an outside click before the menu has mounted", () => {
    renderHeader();
    const [{ callback }] = state.outsideClick;

    expect(() => callback()).not.toThrow();
  });

  it("closes the burger menu when an item in its dropdown is clicked", () => {
    const tree = renderHeaderTree();
    const [details] = findElements(tree, element => element.type === "details");
    const [dropdown] = findElements(details, element => element.type === "ul");
    const removeAttribute = vi.fn();
    details.props.ref!.current = { removeAttribute };

    dropdown.props.onClick?.();

    expect(removeAttribute).toHaveBeenCalledWith("open");
  });
});
