"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { useAccount, useSignMessage } from "wagmi";
import { useLocale } from "~~/i18n/LocaleProvider";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";
import { SignInRequiredError } from "~~/services/api/apiClient";
import { authClient } from "~~/services/auth/authClient";
import { buildSignInMessage, signInChainId } from "~~/services/auth/signInMessage";
import { normalizeAddress } from "~~/utils/address";

/** The signed-in wallet (lowercased) or null, in the react-query cache so every component sees the same answer. */
export const WALLET_SESSION_QUERY_KEY = ["walletSession"] as const;

/**
 * Runs an alert API request; when it fails with a 401 (the session ended), calls `onSignedOut` before rethrowing, so
 * the card asks to sign in again. Once per failed request, unlike watching a query's error, which outlives a refetch.
 */
export const signOutOn401 = async <T>(request: () => Promise<T>, onSignedOut: () => void): Promise<T> => {
  try {
    return await request();
  } catch (error) {
    if (error instanceof SignInRequiredError) onSignedOut();
    throw error;
  }
};

/**
 * Whether the connected wallet is the signed-in one. The alert API acts only for the wallet of the session cookie, so
 * the alert hooks load nothing until this is true. Another wallet's session (after a wallet switch) counts as signed
 * out. Checked again whenever the tab gets focus, since another tab may have signed in with another wallet.
 */
export const useWalletSession = () => {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: WALLET_SESSION_QUERY_KEY,
    queryFn: authClient.getSession,
    enabled: !!address,
    networkMode: "always",
    staleTime: 30_000,
    refetchOnWindowFocus: "always",
  });

  /** After a 401: the session ended, so the card asks to sign in again. */
  const markSignedOut = useCallback(() => queryClient.setQueryData(WALLET_SESSION_QUERY_KEY, null), [queryClient]);

  return {
    isSignedIn: !!address && query.data === normalizeAddress(address),
    /** True until the first answer about the session arrives for a connected wallet. */
    isChecking: !!address && query.isPending,
    markSignedOut,
  };
};

/**
 * Signs the connected wallet in: a nonce from the server, an EIP-4361 message for this site in the page's language,
 * the wallet's signature (wagmi), then the server checks it and sets the session cookie. A declined signature or any
 * other failure is left in `error`; signing in again clears it.
 */
export const useWalletSignIn = () => {
  const { address, chainId } = useAccount();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { signMessageAsync } = useSignMessage();

  const mutation = useMutation({
    mutationFn: async (wallet: Address) => {
      const nonce = await authClient.getNonce();
      const message = buildSignInMessage({
        address: wallet,
        chainId: signInChainId(chainId),
        nonce,
        statement: ALERTS_MESSAGES[locale].signInStatement,
        origin: window.location.origin,
        now: new Date(),
      });
      const signature = await signMessageAsync({ account: wallet, message });
      return authClient.verify(message, signature);
    },
    networkMode: "always",
    onSuccess: signedIn => queryClient.setQueryData(WALLET_SESSION_QUERY_KEY, signedIn),
  });

  const { mutate } = mutation;
  const signIn = useCallback(() => {
    if (address) mutate(address);
  }, [address, mutate]);

  return { signIn, isSigningIn: mutation.isPending, error: mutation.error };
};

/** Ends the session (on wallet disconnect). Best effort: the wallet disconnects whether or not the request succeeds. */
export const useSignOut = () => {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.setQueryData(WALLET_SESSION_QUERY_KEY, null);
    authClient.logout().catch(error => console.error("Failed to sign out:", error));
  }, [queryClient]);
};
