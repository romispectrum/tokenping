// @vitest-environment jsdom
import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ScaffoldEthApp,
  ScaffoldEthAppWithProviders,
  StartWalletSdksWithConnectModal,
  queryClient,
  retryUnlessSignedOut,
} from "~~/components/ScaffoldEthAppWithProviders";
import { SignInRequiredError } from "~~/services/api/apiClient";
import { startWalletSdks } from "~~/services/web3/deferWalletSdks";

const connectModal = vi.hoisted(() => ({ connectModalOpen: false }));

vi.mock("@rainbow-me/rainbowkit", async importOriginal => ({
  ...(await importOriginal<typeof import("@rainbow-me/rainbowkit")>()),
  RainbowKitProvider: ({ children }: { children: ReactNode }) => children,
  useConnectModal: () => connectModal,
}));
vi.mock("wagmi", async importOriginal => ({
  ...(await importOriginal<typeof import("wagmi")>()),
  WagmiProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("next-nprogress-bar", () => ({ AppProgressBar: () => null }));
vi.mock("~~/hooks/custom/useWalletSession", () => ({ useSignOutOnDisconnect: () => undefined }));
vi.mock("~~/services/web3/deferWalletSdks", () => ({ startWalletSdks: vi.fn() }));

// The frame's own markup only: the skip link, the beta tab, header and footer have their own tests.
vi.mock("~~/components/BetaBanner", () => ({
  SkipLink: () => (
    <a href="#main" data-stub="skip-link">
      Skip to content
    </a>
  ),
  BetaBanner: () => <section data-stub="beta-banner" />,
}));
vi.mock("~~/components/Header", () => ({ Header: () => <header data-stub="header" /> }));
vi.mock("~~/components/Footer", () => ({ Footer: () => <footer data-stub="footer" /> }));
vi.mock("react-hot-toast", () => ({ Toaster: () => null }));
vi.mock("~~/components/scaffold-eth", () => ({ BlockieAvatar: () => null }));
vi.mock("~~/services/web3/wagmiConfig", () => ({ wagmiConfig: {} }));

describe("ScaffoldEthApp", () => {
  it("gives the skip link a focusable main landmark to land on", () => {
    const { container } = render(
      <ScaffoldEthApp>
        <h1>Page</h1>
      </ScaffoldEthApp>,
    );

    const main = container.querySelector("main");
    expect(main?.id).toBe("main");
    expect(main?.tabIndex).toBe(-1);
    expect(main?.textContent).toBe("Page");
    expect(container.querySelector('a[href="#main"]')).not.toBeNull();
  });

  it("renders the skip link first, then the header, and the beta tab after the main content", () => {
    const { container } = render(<ScaffoldEthApp>content</ScaffoldEthApp>);

    const order = Array.from(container.querySelectorAll("[data-stub]")).map(element =>
      element.getAttribute("data-stub"),
    );
    expect(order).toEqual(["skip-link", "header", "beta-banner", "footer"]);
    expect(container.querySelector("main")?.nextElementSibling?.getAttribute("data-stub")).toBe("beta-banner");
  });
});

describe("StartWalletSdksWithConnectModal", () => {
  beforeEach(() => {
    vi.mocked(startWalletSdks).mockClear();
    connectModal.connectModalOpen = false;
  });

  it("starts the deferred wallet SDKs when the connect modal opens, not before", () => {
    const { rerender } = render(<StartWalletSdksWithConnectModal />);
    expect(startWalletSdks).not.toHaveBeenCalled();

    connectModal.connectModalOpen = true;
    rerender(<StartWalletSdksWithConnectModal />);
    expect(startWalletSdks).toHaveBeenCalledTimes(1);
  });

  // Without it, no wallet that waits for the modal would ever start from the modal.
  it("is mounted inside the app's providers", () => {
    connectModal.connectModalOpen = true;
    render(<ScaffoldEthAppWithProviders>content</ScaffoldEthAppWithProviders>);

    expect(startWalletSdks).toHaveBeenCalledTimes(1);
  });
});

describe("queryClient", () => {
  it("retries a failed query three times, but never a 401: only signing in again helps", () => {
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(retryUnlessSignedOut);
    expect([0, 1, 2, 3].map(count => retryUnlessSignedOut(count, new Error("Network error")))).toEqual([
      true,
      true,
      true,
      false,
    ]);
    expect(retryUnlessSignedOut(0, new SignInRequiredError("Sign in with your wallet first"))).toBe(false);
  });
});
