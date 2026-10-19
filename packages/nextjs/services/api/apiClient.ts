/**
 * Browser requests use same-origin relative URLs; server-side callers need an absolute base.
 */
const getApiBase = () => {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

export const apiUrl = (path: string) => `${getApiBase()}${path}`;

/**
 * Extracts the API's `error` field (a string, or the first entry of an array) from a failed response.
 * Falls back when the body is not JSON or the error is missing, falsy, blank or the string "undefined".
 */
export const readApiError = async (res: Response, fallback: string) => {
  const body: { error?: unknown } | null = await res.json().catch(() => ({}));
  const raw = Array.isArray(body?.error) ? body.error[0] : body?.error;
  return raw && String(raw).trim() && String(raw) !== "undefined" ? String(raw) : fallback;
};

/** A 401 from a route that needs a signed-in wallet: there is no session, or it has expired. */
export class SignInRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SignInRequiredError";
  }
}

/** The error to throw for a failed response: SignInRequiredError for a 401, otherwise an Error with the API's reason. */
export const apiError = async (res: Response, fallback: string) => {
  const message = await readApiError(res, fallback);
  return res.status === 401 ? new SignInRequiredError(message) : new Error(message);
};
