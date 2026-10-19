// @vitest-environment jsdom
import { act, waitFor } from "@testing-library/react";
import { UserRejectedRequestError, getAddress } from "viem";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  WALLET_SESSION_QUERY_KEY,
  signOutOn401,
  useSignOut,
  useWalletSession,
  useWalletSignIn,
} from "~~/hooks/custom/useWalletSession";
import type { Locale } from "~~/i18n/locales";
import { SignInRequiredError } from "~~/services/api/apiClient";
import { deferred } from "~~/utils/testing/helpers";
import { renderHookWithProviders } from "~~/utils/testing/providers";

const mocks = vi.hoisted(() => ({
  address: undefined as string | undefined,
  chainId: undefined as number | undefined,
  locale: "en" as Locale,
  signMessage: vi.fn<(args: { account: string; message: string }) => Promise<string>>(),
  getSession: vi.fn<() => Promise<string | null>>(),
  getNonce: vi.fn<() => Promise<string>>(),
  verify: vi.fn<(message: string, signature: string) => Promise<string>>(),
  logout: vi.fn<() => Promise<void>>(),
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: mocks.address, chainId: mocks.chainId }),
  useSignMessage: () => ({ signMessageAsync: mocks.signMessage }),
}));
vi.mock("~~/i18n/LocaleProvider", () => ({ useLocale: () => mocks.locale }));
vi.mock("~~/services/auth/authClient", () => ({
  authClient: { getSession: mocks.getSession, getNonce: mocks.getNonce, verify: mocks.verify, logout: mocks.logout },
}));

const ADDRESS = "0xAbCdEf0000000000000000000000000000000001";
const OTHER = "0x1234500000000000000000000000000000000002";
const NONCE = "0123456789abcdef0123456789abcdef";
const NOW = new Date("2026-10-19T12:00:00.000Z");

const render = () =>
  renderHookWithProviders(() => ({ session: useWalletSession(), signIn: useWalletSignIn(), signOut: useSignOut() }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  mocks.address = ADDRESS;
  mocks.chainId = undefined;
  mocks.locale = "en";
  mocks.getSession.mockReset().mockResolvedValue(null);
  mocks.getNonce.mockReset().mockResolvedValue(NONCE);
  mocks.signMessage.mockReset().mockResolvedValue("0x5167");
  mocks.verify
    .mockReset()
    .mockImplementation(async message => message.match(/\n(0x[0-9a-fA-F]{40})\n/)![1].toLowerCase());
  mocks.logout.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useWalletSession", () => {
  it("is signed out and asks nothing without a wallet", () => {
    mocks.address = undefined;
    const { result } = render();
    expect(result.current.session).toMatchObject({ isSignedIn: false, isChecking: false });
    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  it("checks the session, then is signed in when it is the connected wallet's", async () => {
    mocks.getSession.mockResolvedValue(ADDRESS.toLowerCase());
    const { result } = render();
    expect(result.current.session).toMatchObject({ isSignedIn: false, isChecking: true });
    await waitFor(() => expect(result.current.session.isSignedIn).toBe(true));
    expect(result.current.session.isChecking).toBe(false);
  });

  it("counts another wallet's session as signed out, as after a wallet switch", async () => {
    mocks.getSession.mockResolvedValue(OTHER.toLowerCase());
    const { result } = render();
    await waitFor(() => expect(result.current.session.isChecking).toBe(false));
    expect(result.current.session.isSignedIn).toBe(false);
  });

  it("is signed out after markSignedOut (a 401 elsewhere)", async () => {
    mocks.getSession.mockResolvedValue(ADDRESS.toLowerCase());
    const { result, queryClient } = render();
    await waitFor(() => expect(result.current.session.isSignedIn).toBe(true));
    act(() => result.current.session.markSignedOut());
    await waitFor(() => expect(result.current.session.isSignedIn).toBe(false));
    expect(queryClient.getQueryData(WALLET_SESSION_QUERY_KEY)).toBeNull();
  });
});

describe("useWalletSignIn", () => {
  it("gets a nonce, has the wallet sign this site's message, verifies it and is then signed in", async () => {
    mocks.chainId = 8453;
    const { result } = render();
    await waitFor(() => expect(result.current.session.isChecking).toBe(false));

    act(() => result.current.signIn.signIn());
    await waitFor(() => expect(result.current.session.isSignedIn).toBe(true));

    const message =
      `${window.location.host} wants you to sign in with your Ethereum account:\n${getAddress(ADDRESS)}\n\n` +
      "Sign in to Tokenping to see and edit your health factor alerts.\n\n" +
      `URI: ${window.location.origin}\nVersion: 1\nChain ID: 8453\nNonce: ${NONCE}\n` +
      "Issued At: 2026-10-19T12:00:00.000Z\nExpiration Time: 2026-10-19T12:05:00.000Z";
    expect(mocks.signMessage.mock.calls).toEqual([[{ account: ADDRESS, message }]]);
    expect(mocks.verify.mock.calls).toEqual([[message, "0x5167"]]);
    // The session came from the verify answer, not from asking again.
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    expect(result.current.signIn.error).toBeNull();
  });

  it("writes the wallet's line in the page's language", async () => {
    mocks.locale = "cs";
    const { result } = render();
    act(() => result.current.signIn.signIn());
    await waitFor(() => expect(mocks.signMessage).toHaveBeenCalled());
    expect(mocks.signMessage.mock.calls[0][0].message).toContain(
      "\n\nPřihlášení do Tokenpingu pro zobrazení a úpravy upozornění na health factor.\n\n",
    );
  });

  it("is busy while the wallet is asked", async () => {
    const signature = deferred<string>();
    mocks.signMessage.mockReturnValue(signature.promise);
    const { result } = render();
    act(() => result.current.signIn.signIn());
    await waitFor(() => expect(result.current.signIn.isSigningIn).toBe(true));
    await act(async () => signature.resolve("0x5167"));
    await waitFor(() => expect(result.current.signIn.isSigningIn).toBe(false));
  });

  it("leaves a declined signature in error, stays signed out and never verifies", async () => {
    const declined = new UserRejectedRequestError(new Error("User rejected the request."));
    mocks.signMessage.mockRejectedValue(declined);
    const { result } = render();
    act(() => result.current.signIn.signIn());
    await waitFor(() => expect(result.current.signIn.error).toBe(declined));
    expect(result.current.session.isSignedIn).toBe(false);
    expect(mocks.verify).not.toHaveBeenCalled();
  });

  it("does nothing without a wallet", async () => {
    mocks.address = undefined;
    const { result } = render();
    act(() => result.current.signIn.signIn());
    expect(mocks.getNonce).not.toHaveBeenCalled();
  });
});

describe("useSignOut", () => {
  it("forgets the session at once and asks the server to clear its cookie", async () => {
    mocks.getSession.mockResolvedValue(ADDRESS.toLowerCase());
    const { result } = render();
    await waitFor(() => expect(result.current.session.isSignedIn).toBe(true));
    act(() => result.current.signOut());
    expect(mocks.logout).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.session.isSignedIn).toBe(false));
  });

  it("logs a failed sign-out instead of throwing", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.logout.mockRejectedValue(new Error("offline"));
    const { result } = render();
    act(() => result.current.signOut());
    await waitFor(() => expect(errors).toHaveBeenCalledWith("Failed to sign out:", new Error("offline")));
  });
});

describe("signOutOn401", () => {
  it("passes a result through without signing out", async () => {
    const onSignedOut = vi.fn();
    expect(await signOutOn401(async () => "ok", onSignedOut)).toBe("ok");
    expect(onSignedOut).not.toHaveBeenCalled();
  });

  it("signs out on a 401, then rethrows it", async () => {
    const onSignedOut = vi.fn();
    const signedOut = new SignInRequiredError("Sign in with your wallet first");
    await expect(signOutOn401(() => Promise.reject(signedOut), onSignedOut)).rejects.toBe(signedOut);
    expect(onSignedOut).toHaveBeenCalledTimes(1);
  });

  it("rethrows any other failure without signing out", async () => {
    const onSignedOut = vi.fn();
    await expect(signOutOn401(() => Promise.reject(new Error("Database error")), onSignedOut)).rejects.toThrow(
      "Database error",
    );
    expect(onSignedOut).not.toHaveBeenCalled();
  });
});
