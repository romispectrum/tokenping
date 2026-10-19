import { apiError, apiUrl } from "~~/services/api/apiClient";

const AUTH_PATH = "/api/auth";

const post = (path: string, body?: unknown) =>
  fetch(apiUrl(`${AUTH_PATH}/${path}`), {
    method: "POST",
    ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });

/** Browser client for Sign-in with Ethereum (app/api/auth). The session itself is an HttpOnly cookie. */
export const authClient = {
  /** The signed-in wallet, lowercased, or null. */
  async getSession(): Promise<string | null> {
    const res = await fetch(apiUrl(`${AUTH_PATH}/session`), { cache: "no-store" });
    if (!res.ok) throw await apiError(res, "Failed to read the sign-in");
    const { address } = (await res.json()) as { address?: unknown };
    return typeof address === "string" ? address : null;
  },

  async getNonce(): Promise<string> {
    const res = await post("nonce");
    if (!res.ok) throw await apiError(res, "Failed to start signing in");
    return ((await res.json()) as { nonce: string }).nonce;
  },

  /** Sends the signed message; resolves with the wallet now signed in, lowercased. */
  async verify(message: string, signature: string): Promise<string> {
    const res = await post("verify", { message, signature });
    if (!res.ok) throw await apiError(res, "Failed to sign in");
    return ((await res.json()) as { address: string }).address;
  },

  async logout(): Promise<void> {
    const res = await post("logout");
    if (!res.ok) throw await apiError(res, "Failed to sign out");
  },
};
