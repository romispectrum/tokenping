// @vitest-environment jsdom
import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { arbitrum, mainnet } from "viem/chains";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth/RainbowKitCustomConnectButton";
import { LocaleProvider } from "~~/i18n/LocaleProvider";
import type { Locale } from "~~/i18n/locales";

const ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

type ConnectState = {
  account?: { address: string; displayName: string };
  chain?: { id: number; name: string; unsupported?: boolean };
};

// Seeded in beforeEach: what RainbowKit hands its custom button. `calls` records disconnects and sign-outs in order.
const state = vi.hoisted(() => ({ connect: {} as ConnectState, calls: [] as string[] }));

vi.mock("@rainbow-me/rainbowkit", () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (props: Record<string, unknown>) => ReactNode }) =>
      children({ ...state.connect, mounted: true, openConnectModal: () => undefined }),
  },
}));

vi.mock("@scaffold-ui/components", () => ({ Address: () => null, Balance: () => null }));

vi.mock("burner-connector", () => ({ rainbowkitBurnerWallet: { useSessionStorage: false } }));

vi.mock("wagmi", () => ({
  useAccount: () => ({ chain: state.connect.chain, connector: { id: "injected" } }),
  useDisconnect: () => ({ disconnect: () => void state.calls.push("disconnect") }),
  useSwitchChain: () => ({ switchChain: () => undefined }),
}));

vi.mock("~~/components/scaffold-eth", () => ({ BlockieAvatar: () => null }));

vi.mock("~~/hooks/custom/useWalletSession", () => ({ useSignOut: () => () => void state.calls.push("sign out") }));

vi.mock("~~/hooks/scaffold-eth", () => ({
  useCopyToClipboard: () => ({ copyToClipboard: () => undefined, isCopiedToClipboard: false }),
  useOutsideClick: () => undefined,
  useTargetNetwork: () => ({ targetNetwork: { id: arbitrum.id } }),
}));

vi.mock("~~/hooks/scaffold-eth/useTargetNetwork", () => ({
  useTargetNetwork: () => ({ targetNetwork: { id: arbitrum.id, name: arbitrum.name } }),
}));

const renderButton = (locale: Locale) =>
  render(
    <LocaleProvider locale={locale}>
      <RainbowKitCustomConnectButton />
    </LocaleProvider>,
  );

describe("RainbowKitCustomConnectButton", () => {
  beforeEach(() => {
    state.connect = {};
    state.calls = [];
  });

  it("asks to connect a wallet, in English and in Czech", () => {
    const { unmount } = renderButton("en");
    expect(screen.getByRole("button", { name: "Connect wallet" }).textContent).toBe("Connect walletConnect");
    unmount();

    renderButton("cs");
    expect(screen.getByRole("button", { name: "Připojit peněženku" }).textContent).toBe("Připojit peněženkuPřipojit");
  });

  it("says Wrong network, offers the target network and disconnects, in Czech", () => {
    state.connect = {
      account: { address: ADDRESS, displayName: "0xd8dA…6045" },
      chain: { id: mainnet.id, name: mainnet.name },
    };
    renderButton("cs");

    expect(screen.getByText("Špatná síť")).toBeTruthy();
    expect(screen.getByRole("button", { name: `Přepnout na síť ${arbitrum.name}` })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Odpojit" })).toBeTruthy();
  });

  it("lists the account menu items in Czech once connected", () => {
    state.connect = {
      account: { address: ADDRESS, displayName: "0xd8dA…6045" },
      chain: { id: arbitrum.id, name: arbitrum.name },
    };
    const { container } = renderButton("cs");

    for (const text of ["Kopírovat adresu", "Zobrazit QR kód", "Zobrazit v průzkumníku bloků", "Odpojit"])
      expect(screen.getByText(text)).toBeTruthy();
    expect(screen.queryByText("Copy address")).toBeNull();
    expect(container.innerHTML).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
  });

  it("keeps the English account menu as it was", () => {
    state.connect = {
      account: { address: ADDRESS, displayName: "0xd8dA…6045" },
      chain: { id: arbitrum.id, name: arbitrum.name },
    };
    renderButton("en");

    for (const text of ["Copy address", "View QR Code", "View on Block Explorer", "Disconnect"])
      expect(screen.getByText(text)).toBeTruthy();
  });

  it.each([
    ["the account menu", { id: arbitrum.id, name: arbitrum.name }],
    ["the wrong network menu", { id: mainnet.id, name: mainnet.name }],
  ])("ends the alert settings' session when Disconnect is pressed in %s", (_label, chain) => {
    state.connect = { account: { address: ADDRESS, displayName: "0xd8dA…6045" }, chain };
    renderButton("en");
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(state.calls).toEqual(["sign out", "disconnect"]);
  });
});
